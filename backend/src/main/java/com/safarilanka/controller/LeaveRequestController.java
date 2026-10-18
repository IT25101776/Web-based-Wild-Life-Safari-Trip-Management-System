package com.safarilanka.controller;

import com.safarilanka.dto.LeaveRequestCreate;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/leave-requests")
public class LeaveRequestController {
    private final LeaveRequestRepository leaves; private final CurrentUserService current; private final UserRepository users; private final NotificationService notifications; private final AuditService audit;
    public LeaveRequestController(LeaveRequestRepository l,CurrentUserService c,UserRepository u,NotificationService n,AuditService a){leaves=l;current=c;users=u;notifications=n;audit=a;}

    @PostMapping
    @PreAuthorize("hasAnyRole('SAFARI_GUIDE','JEEP_DRIVER')")
    public LeaveRequest create(@Valid @RequestBody LeaveRequestCreate r,Authentication a){
        User u=current.get(a);if(r.startDate().isBefore(LocalDate.now()))throw new IllegalArgumentException("Leave start date cannot be in the past");if(r.endDate().isBefore(r.startDate()))throw new IllegalArgumentException("Leave end date cannot be before start date");
        if(leaves.existsByRequesterIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(u.getId(),LeaveRequestStatus.PENDING,r.endDate(),r.startDate()))throw new IllegalStateException("You already have a pending leave request overlapping these dates");
        LeaveRequest x=new LeaveRequest();x.setRequester(u);x.setStartDate(r.startDate());x.setEndDate(r.endDate());x.setNote(r.note().trim());leaves.save(x);
        notifications.sendToAdmins(u,"New leave request",u.getFullName()+" requested leave from "+r.startDate()+" to "+r.endDate()+". Note: "+r.note(),"LEAVE_REQUEST");audit.log(a.getName(),"LEAVE_REQUEST_CREATE",r.startDate()+" to "+r.endDate());return x;
    }

    @GetMapping("/mine") @PreAuthorize("hasAnyRole('SAFARI_GUIDE','JEEP_DRIVER')") public List<LeaveRequest> mine(Authentication a){return leaves.findByRequesterEmailOrderByCreatedAtDesc(a.getName());}
    @GetMapping @PreAuthorize("hasRole('SYSTEM_ADMIN')") public List<LeaveRequest> all(){return leaves.findAllByOrderByCreatedAtDesc();}

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public LeaveRequest review(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication a){
        LeaveRequest x=leaves.findById(id).orElseThrow(()->new IllegalArgumentException("Leave request not found"));if(x.getStatus()!=LeaveRequestStatus.PENDING)throw new IllegalStateException("This leave request has already been reviewed");
        LeaveRequestStatus status=LeaveRequestStatus.valueOf(body.getOrDefault("status","").toUpperCase(Locale.ROOT));if(status!=LeaveRequestStatus.APPROVED&&status!=LeaveRequestStatus.REJECTED)throw new IllegalArgumentException("Decision must be APPROVED or REJECTED");
        x.setStatus(status);x.setAdminNote(Optional.ofNullable(body.get("note")).map(String::trim).orElse(""));x.setReviewedByEmail(a.getName());x.setReviewedAt(LocalDateTime.now());leaves.save(x);
        User u=x.getRequester();if(status==LeaveRequestStatus.APPROVED && !LocalDate.now().isBefore(x.getStartDate()) && !LocalDate.now().isAfter(x.getEndDate())){u.setOnLeave(true);u.setAvailable(false);users.save(u);}
        notifications.send(u,current.get(a),"Leave request "+status.name().toLowerCase(Locale.ROOT),"Your leave request for "+x.getStartDate()+" to "+x.getEndDate()+" was "+status.name().toLowerCase(Locale.ROOT)+(x.getAdminNote()==null||x.getAdminNote().isBlank()?"":". Admin note: "+x.getAdminNote()),"LEAVE_DECISION");
        audit.log(a.getName(),"LEAVE_REQUEST_REVIEW",u.getEmail()+" -> "+status);return x;
    }
}
