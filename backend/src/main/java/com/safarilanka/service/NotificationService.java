package com.safarilanka.service;

import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class NotificationService {
    private final NotificationRepository notifications;
    private final UserRepository users;
    public NotificationService(NotificationRepository n,UserRepository u){notifications=n;users=u;}

    public Notification send(User recipient, User sender, String title, String message, String category){
        if(recipient==null||recipient.isArchived()||!recipient.isActive()) return null;
        Notification n=new Notification();n.setRecipient(recipient);n.setSender(sender);n.setTitle(clean(title,180));n.setMessage(clean(message,2500));n.setCategory(category==null?"SYSTEM":category);return notifications.save(n);
    }
    public void sendToRole(Role role, User sender, String title,String message,String category){
        users.findByRole(role).stream().filter(u->u.isActive()&&!u.isArchived()).forEach(u->send(u,sender,title,message,category));
    }
    public void sendToAdmins(User sender,String title,String message,String category){sendToRole(Role.SYSTEM_ADMIN,sender,title,message,category);}
    public void sendToOperators(User sender,String title,String message,String category){sendToRole(Role.SAFARI_OPERATOR,sender,title,message,category);}
    public void sendToFinance(User sender,String title,String message,String category){sendToRole(Role.FINANCE_MANAGER,sender,title,message,category);}
    public User userByEmail(String email){return users.findByEmailIgnoreCase(email).orElse(null);}
    public User userById(Long id){return id==null?null:users.findById(id).orElseThrow(()->new IllegalArgumentException("Recipient not found"));}
    public List<User> activeUsers(){return users.findAll().stream().filter(u->u.isActive()&&!u.isArchived()).toList();}
    private String clean(String s,int max){String v=s==null?"":s.trim();if(v.isEmpty())throw new IllegalArgumentException("Notification text is required");return v.length()>max?v.substring(0,max):v;}
}
