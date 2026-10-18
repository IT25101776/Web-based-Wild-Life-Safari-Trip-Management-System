package com.safarilanka.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="account_change_requests")
public class AccountChangeRequest {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.EAGER, optional=false) private User requester;
    @Column(nullable=false) private String currentFullName;
    @Column(nullable=false) private String currentEmail;
    @Column(nullable=false) private String requestedFullName;
    @Column(nullable=false) private String requestedEmail;
    @Column(nullable=false, length=30) private String status="PENDING";
    @Column(length=1000) private String adminNote;
    private String reviewedByEmail;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();if(status==null||status.isBlank())status="PENDING";}

    public Long getId(){return id;} public void setId(Long v){id=v;}
    public User getRequester(){return requester;} public void setRequester(User v){requester=v;}
    public String getCurrentFullName(){return currentFullName;} public void setCurrentFullName(String v){currentFullName=v;}
    public String getCurrentEmail(){return currentEmail;} public void setCurrentEmail(String v){currentEmail=v;}
    public String getRequestedFullName(){return requestedFullName;} public void setRequestedFullName(String v){requestedFullName=v;}
    public String getRequestedEmail(){return requestedEmail;} public void setRequestedEmail(String v){requestedEmail=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public String getAdminNote(){return adminNote;} public void setAdminNote(String v){adminNote=v;}
    public String getReviewedByEmail(){return reviewedByEmail;} public void setReviewedByEmail(String v){reviewedByEmail=v;}
    public LocalDateTime getReviewedAt(){return reviewedAt;} public void setReviewedAt(LocalDateTime v){reviewedAt=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
