package com.safarilanka.service;
import com.safarilanka.model.AuditLog; import com.safarilanka.repository.AuditLogRepository; import org.springframework.stereotype.Service;
@Service public class AuditService { private final AuditLogRepository repo; public AuditService(AuditLogRepository r){repo=r;} public void log(String email,String action,String details){AuditLog a=new AuditLog(); a.setActorEmail(email); a.setAction(action); a.setDetails(details); repo.save(a);} }
