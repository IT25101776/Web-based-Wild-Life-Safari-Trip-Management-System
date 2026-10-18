package com.safarilanka.controller;

import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/account-change-requests")
@PreAuthorize("isAuthenticated()")
public class AccountChangeRequestController {
    private final AccountChangeRequestRepository requests;
    private final UserRepository users;
    private final CurrentUserService current;
    private final NotificationService notifications;
    private final AuditService audit;

    public AccountChangeRequestController(AccountChangeRequestRepository r,UserRepository u,CurrentUserService c,NotificationService n,AuditService a){requests=r;users=u;current=c;notifications=n;audit=a;}

    @PostMapping
    public Map<String,Object> request(@RequestBody Map<String,String> body, Authentication a){
        User requester=current.get(a);
        if(requester.getRole()==Role.TOURIST) throw new IllegalArgumentException("Tourists can change their email directly from My Account.");
        if(requester.getRole()==Role.SYSTEM_ADMIN) throw new IllegalArgumentException("System Administrators can change their own name and email directly from My Account.");
        if(requests.existsByRequesterIdAndStatus(requester.getId(),"PENDING")) throw new IllegalStateException("You already have a pending name / login email change request.");
        String requestedName=cleanName(body.get("requestedFullName"));
        String requestedEmail=RoleLoginEmailPolicy.emailFor(requestedName,requester.getRole());
        Optional<User> existing=users.findByEmailIgnoreCase(requestedEmail);
        if(existing.isPresent()&&!existing.get().getId().equals(requester.getId())) throw new IllegalArgumentException("The generated login email is already used by another account: "+requestedEmail);
        if(requestedName.equalsIgnoreCase(requester.getFullName())&&requestedEmail.equalsIgnoreCase(requester.getEmail())) throw new IllegalArgumentException("Enter a different name before submitting the request.");

        AccountChangeRequest r=new AccountChangeRequest();
        r.setRequester(requester);r.setCurrentFullName(requester.getFullName());r.setCurrentEmail(requester.getEmail());r.setRequestedFullName(requestedName);r.setRequestedEmail(requestedEmail);r.setStatus("PENDING");requests.save(r);
        notifications.sendToAdmins(requester,"Account name / login email change request",
                requester.getFullName()+" requested a staff login rename. Current: "+requester.getEmail()+". Requested name: "+requestedName+". Proposed login: "+requestedEmail+".","ACCOUNT_CHANGE_REQUEST");
        audit.log(a.getName(),"ACCOUNT_CHANGE_REQUEST",requester.getEmail()+" -> "+requestedEmail);
        return Map.of("message","Your name and login email change request was sent to System Administration.","request",r);
    }

    @GetMapping("/mine")
    public List<AccountChangeRequest> mine(Authentication a){return requests.findTop20ByRequesterIdOrderByCreatedAtDesc(current.get(a).getId());}

    @GetMapping("/admin")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public List<AccountChangeRequest> admin(){return requests.findAllByOrderByCreatedAtDesc();}

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public Map<String,Object> review(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication a){
        User admin=current.get(a);AccountChangeRequest r=requests.findById(id).orElseThrow(()->new IllegalArgumentException("Account change request not found"));
        if(!"PENDING".equalsIgnoreCase(r.getStatus())) throw new IllegalStateException("This request has already been reviewed.");
        String status=Optional.ofNullable(body.get("status")).orElse("").trim().toUpperCase(Locale.ROOT);
        if(!Set.of("APPROVED","REJECTED").contains(status)) throw new IllegalArgumentException("Status must be APPROVED or REJECTED");
        String note=Optional.ofNullable(body.get("note")).orElse("").trim();
        User requester=users.findById(r.getRequester().getId()).orElseThrow(()->new IllegalArgumentException("Requester account no longer exists"));

        if("APPROVED".equals(status)){
            String nextEmail=RoleLoginEmailPolicy.emailFor(r.getRequestedFullName(),requester.getRole());
            Optional<User> existing=users.findByEmailIgnoreCase(nextEmail);
            if(existing.isPresent()&&!existing.get().getId().equals(requester.getId())) throw new IllegalArgumentException("The generated login email is already used by another account: "+nextEmail);
            String oldEmail=requester.getEmail();
            requester.setFullName(r.getRequestedFullName());requester.setEmail(nextEmail);users.save(requester);
            r.setRequestedEmail(nextEmail);
            notifications.send(requester,admin,"Account rename approved","Your requested name was approved. Your new login email is "+nextEmail+". Use that email the next time you sign in.","ACCOUNT_CHANGE_DECISION");
            audit.log(a.getName(),"ACCOUNT_CHANGE_APPROVE",oldEmail+" -> "+nextEmail);
        }else{
            notifications.send(requester,admin,"Account rename request rejected","Your requested name / login email change was not approved."+(note.isBlank()?"":" Admin note: "+note),"ACCOUNT_CHANGE_DECISION");
            audit.log(a.getName(),"ACCOUNT_CHANGE_REJECT",requester.getEmail());
        }
        r.setStatus(status);r.setAdminNote(note.isBlank()?null:note);r.setReviewedByEmail(a.getName());r.setReviewedAt(LocalDateTime.now());requests.save(r);
        return Map.of("message","Account change request "+status.toLowerCase(Locale.ROOT)+" successfully.","request",r);
    }

    private String cleanName(String raw){String v=Optional.ofNullable(raw).orElse("").trim().replaceAll("\\s+"," ");if(v.length()<2)throw new IllegalArgumentException("Enter the new full name you want to use");if(v.length()>255)throw new IllegalArgumentException("Full name is too long");return v;}
}
