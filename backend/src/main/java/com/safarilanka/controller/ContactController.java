package com.safarilanka.controller;

import com.safarilanka.model.ContactMessage;
import com.safarilanka.repository.ContactMessageRepository;
import com.safarilanka.service.AuditService;
import com.safarilanka.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
 private final ContactMessageRepository messages; private final AuditService audit; private final NotificationService notifications;
 public ContactController(ContactMessageRepository messages,AuditService audit,NotificationService notifications){this.messages=messages;this.audit=audit;this.notifications=notifications;}
 @PostMapping public ContactMessage create(@RequestBody Map<String,String> b){
  String name=clean(b.get("fullName"),120), email=clean(b.get("email"),180), phone=clean(b.get("phone"),15), code=clean(b.get("bookingCode"),40), subject=clean(b.get("subject"),160), text=clean(b.get("message"),3000);
  if(name.isBlank())throw new IllegalArgumentException("Name is required");
  if(!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))throw new IllegalArgumentException("Enter a valid email address");
  if(!phone.isBlank()&&!phone.matches("\\d{7,15}"))throw new IllegalArgumentException("Phone number must contain 7 to 15 digits only");
  if(subject.isBlank())throw new IllegalArgumentException("Subject is required");
  if(text.length()<10)throw new IllegalArgumentException("Please enter at least 10 characters in your message");
  ContactMessage x=new ContactMessage();x.setFullName(name);x.setEmail(email);x.setPhone(phone);x.setBookingCode(code.toUpperCase(Locale.ROOT));x.setSubject(subject);x.setMessage(text);x=messages.save(x);String details=name+" sent a contact request: "+subject+(x.getBookingCode()==null||x.getBookingCode().isBlank()?"":" ("+x.getBookingCode()+")");notifications.sendToAdmins(null,"New contact request",details,"CONTACT");notifications.sendToOperators(null,"New contact request",details,"CONTACT");return x;
 }
 @GetMapping @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public List<ContactMessage> all(){return messages.findAllByOrderByCreatedAtDesc();}
 @PatchMapping("/{id}/status") @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public ContactMessage status(@PathVariable Long id,@RequestBody Map<String,String> b,Authentication a){
  ContactMessage x=messages.findById(id).orElseThrow(()->new IllegalArgumentException("Contact request not found"));String status=b.getOrDefault("status","READ").toUpperCase(Locale.ROOT);if(!Set.of("NEW","READ","RESOLVED").contains(status))throw new IllegalArgumentException("Invalid contact status");x.setStatus(status);messages.save(x);audit.log(a.getName(),"CONTACT_STATUS","#"+id+" -> "+status);return x;
 }
 private String clean(String s,int max){if(s==null)return "";String v=s.trim();return v.length()>max?v.substring(0,max):v;}
}
