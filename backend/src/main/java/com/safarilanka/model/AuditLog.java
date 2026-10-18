package com.safarilanka.model;
import jakarta.persistence.*; import java.time.*;
@Entity @Table(name="audit_logs")
public class AuditLog {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 private String actorEmail; private String action; @Column(length=2000) private String details; private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public String getActorEmail(){return actorEmail;} public void setActorEmail(String v){actorEmail=v;}
 public String getAction(){return action;} public void setAction(String v){action=v;} public String getDetails(){return details;} public void setDetails(String v){details=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
