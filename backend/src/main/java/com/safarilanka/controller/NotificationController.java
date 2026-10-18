package com.safarilanka.controller;

import com.safarilanka.dto.*;
import com.safarilanka.model.*;
import com.safarilanka.repository.NotificationRepository;
import com.safarilanka.service.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {
    private final NotificationRepository notifications; private final CurrentUserService current; private final NotificationService service; private final AuditService audit;
    public NotificationController(NotificationRepository n,CurrentUserService c,NotificationService s,AuditService a){notifications=n;current=c;service=s;audit=a;}

    @GetMapping("/mine") public List<Notification> mine(Authentication a){return notifications.findTop100ByRecipientEmailOrderByCreatedAtDesc(a.getName());}
    @GetMapping("/unread-count") public Map<String,Long> count(Authentication a){return Map.of("count",notifications.countByRecipientEmailAndReadFlagFalse(a.getName()));}
    @PatchMapping("/{id}/read") public Notification read(@PathVariable Long id,Authentication a){Notification n=owned(id,a);n.setReadFlag(true);return notifications.save(n);}
    @PatchMapping("/read-all") public Map<String,Object> readAll(Authentication a){for(Notification n:notifications.findTop100ByRecipientEmailOrderByCreatedAtDesc(a.getName())){if(!n.isReadFlag()){n.setReadFlag(true);notifications.save(n);}}return Map.of("ok",true);}

    @PostMapping("/message-admin")
    public Map<String,Object> messageAdmin(@Valid @RequestBody NotificationMessageRequest r,Authentication a){
        User sender=current.get(a);service.sendToAdmins(sender,r.title(),r.message(),"MESSAGE_TO_ADMIN");audit.log(a.getName(),"MESSAGE_ADMIN",r.title());return Map.of("message","Message sent to System Administration.");
    }

    @PostMapping("/admin/send")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public Map<String,Object> adminSend(@Valid @RequestBody AdminNotificationRequest r,Authentication a){
        User sender=current.get(a);String type=r.targetType().trim().toUpperCase(Locale.ROOT);int sent=0;
        if("USER".equals(type)){
            service.send(service.userById(r.recipientId()),sender,r.title(),r.message(),"ADMIN_NOTICE");sent=1;
        }else if("ROLE".equals(type)){
            Role role=Role.valueOf(Optional.ofNullable(r.role()).orElseThrow(()->new IllegalArgumentException("Choose a target role")).toUpperCase(Locale.ROOT));
            List<User> targets=service.activeUsers().stream().filter(u->u.getRole()==role).toList();targets.forEach(u->service.send(u,sender,r.title(),r.message(),"ADMIN_NOTICE"));sent=targets.size();
        }else if("ALL".equals(type)){
            List<User> targets=service.activeUsers().stream().filter(u->!u.getId().equals(sender.getId())).toList();targets.forEach(u->service.send(u,sender,r.title(),r.message(),"ADMIN_NOTICE"));sent=targets.size();
        }else throw new IllegalArgumentException("Target type must be USER, ROLE or ALL");
        audit.log(a.getName(),"ADMIN_NOTICE",r.title()+" / recipients="+sent);return Map.of("message","Notice sent.","sent",sent);
    }

    private Notification owned(Long id,Authentication a){Notification n=notifications.findById(id).orElseThrow(()->new IllegalArgumentException("Notification not found"));if(!n.getRecipient().getEmail().equalsIgnoreCase(a.getName()))throw new IllegalArgumentException("Not your notification");return n;}
}
