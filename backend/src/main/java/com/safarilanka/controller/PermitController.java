package com.safarilanka.controller;

import com.safarilanka.dto.*;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.*;
import com.safarilanka.service.permit.validation.PermitValidationContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;

@RestController @RequestMapping("/api/permits")
public class PermitController {
 private final PermitRepository permits; private final TripAssignmentRepository assignments; private final UserRepository users; private final AuditService audit; private final PermitValidationContext permitValidationContext; private final NotificationService notifications;
 public PermitController(PermitRepository p,TripAssignmentRepository ta,UserRepository u,AuditService a,PermitValidationContext pvc,NotificationService n){permits=p;assignments=ta;users=u;audit=a;permitValidationContext=pvc;notifications=n;}

 @GetMapping("/mine") @PreAuthorize("hasRole('TOURIST')") public List<Permit> mine(Authentication a){return permits.findByBookingTouristEmailOrderByCreatedAtDesc(a.getName());}
 @GetMapping @PreAuthorize("hasAnyRole('PARK_OFFICER','SYSTEM_ADMIN')") public List<Permit> all(){return permits.findAll();}
 @GetMapping("/pending") @PreAuthorize("hasAnyRole('PARK_OFFICER','SYSTEM_ADMIN')") public List<Permit> pending(){return permits.findByStatusOrderByCreatedAtAsc(PermitStatus.PENDING);}

 @PatchMapping("/{id}/decision") @PreAuthorize("hasAnyRole('PARK_OFFICER','SYSTEM_ADMIN')")
 public Permit decide(@PathVariable Long id,@RequestBody PermitDecisionRequest r,Authentication a){
  Permit p=permits.findById(id).orElseThrow();if(p.getStatus()!=PermitStatus.PENDING)throw new IllegalStateException("Permit has already been reviewed");Booking b=p.getBooking();permitValidationContext.validateForReview(b);
  User actor=users.findByEmailIgnoreCase(a.getName()).orElse(null);p.setStatus(r.approved()?PermitStatus.APPROVED:PermitStatus.REJECTED);p.setDecisionReason(r.reason()==null||r.reason().isBlank()?(r.approved()?"Permit approved and issued.":"Permit rejected."):r.reason().trim());p.setDecisionByEmail(a.getName());p.setDecisionByName(actor==null?a.getName():actor.getFullName());p.setDecisionByRole(actor==null?"AUTHORIZED_USER":actor.getRole().name());if(r.approved())p.setIssuedAt(LocalDateTime.now());permits.save(p);
  notifications.send(b.getTourist(),actor,r.approved()?"Digital permit approved":"Digital permit rejected",b.getBookingCode()+" • "+p.getPermitCode()+" • "+p.getDecisionReason(),"PERMIT");
  audit.log(a.getName(),"PERMIT_DECISION",p.getPermitCode()+" -> "+p.getStatus()+" / "+p.getDecisionReason());return p;
 }

 @PostMapping("/validate") @PreAuthorize("hasAnyRole('PARK_OFFICER','SYSTEM_ADMIN')")
 public Map<String,Object> validate(@RequestBody PermitValidationRequest r,Authentication a){
  Permit p=permits.findByPermitCodeIgnoreCase(r.permitCode()).orElseThrow(()->new IllegalArgumentException("Permit code not found"));String action=r.action().toUpperCase(Locale.ROOT);User actor=users.findByEmailIgnoreCase(a.getName()).orElse(null);Booking b=p.getBooking();
  if("CHECK_IN".equals(action)){
   if(p.getStatus()!=PermitStatus.APPROVED)throw new IllegalStateException("Permit must be approved and issued before check-in. Current status: "+p.getStatus());p.setStatus(PermitStatus.CHECKED_IN);p.setCheckedInAt(LocalDateTime.now());p.setCheckedInByEmail(a.getName());
  }else if("CHECK_OUT".equals(action)){
   if(p.getStatus()!=PermitStatus.CHECKED_IN)throw new IllegalStateException("Permit must be checked in before check-out");p.setStatus(PermitStatus.COMPLETED);p.setCheckedOutAt(LocalDateTime.now());p.setCheckedOutByEmail(a.getName());
  }else throw new IllegalArgumentException("Action must be CHECK_IN or CHECK_OUT");
  permits.save(p);audit.log(a.getName(),"PERMIT_"+action,p.getPermitCode());
  List<TripAssignment> teams=assignments.findByBookingIdOrderByIdAsc(b.getId());
  if("CHECK_IN".equals(action)){
    notifications.send(b.getTourist(),actor,"Safari checked in",b.getBookingCode()+" has entered Yala. The safari is now ongoing.","GATE");
    for(TripAssignment t:teams){notifications.send(t.getDriver(),actor,"Park check-in completed",b.getBookingCode()+" has been checked in at the gate.","GATE");notifications.send(t.getGuide(),actor,"Park check-in completed",b.getBookingCode()+" has been checked in at the gate.","GATE");}
  }else{
    notifications.send(b.getTourist(),actor,"Park checkout completed",b.getBookingCode()+" has been checked out. The assigned driver will now complete the trip.","GATE");
    for(TripAssignment t:teams){notifications.send(t.getDriver(),actor,"Checkout complete - finish trip",b.getBookingCode()+" has been checked out by the Park Officer. Your Complete Trip button is now enabled.","GATE_CHECKOUT");notifications.send(t.getGuide(),actor,"Park checkout completed",b.getBookingCode()+" has exited the park. Waiting for the assigned driver to complete the trip.","GATE_CHECKOUT");}
    notifications.sendToOperators(actor,"Park checkout completed",b.getBookingCode()+" has checked out. Waiting for driver trip completion.","GATE_CHECKOUT");
  }
  String message="CHECK_IN".equals(action)?"Check-in successful. Park entry has been recorded and the safari is now ongoing.":"Check-out successful. Park exit has been recorded. The assigned driver can now manually complete the trip.";return Map.of("message",message,"permit",p);
 }
}
