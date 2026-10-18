package com.safarilanka.model;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name="leave_requests")
public class LeaveRequest {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.EAGER, optional=false) private User requester;
    @Column(nullable=false) private LocalDate startDate;
    @Column(nullable=false) private LocalDate endDate;
    @Column(nullable=false, length=1000) private String note;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private LeaveRequestStatus status=LeaveRequestStatus.PENDING;
    @Column(length=1000) private String adminNote;
    private String reviewedByEmail;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public User getRequester(){return requester;} public void setRequester(User v){requester=v;}
    public LocalDate getStartDate(){return startDate;} public void setStartDate(LocalDate v){startDate=v;}
    public LocalDate getEndDate(){return endDate;} public void setEndDate(LocalDate v){endDate=v;}
    public String getNote(){return note;} public void setNote(String v){note=v;}
    public LeaveRequestStatus getStatus(){return status;} public void setStatus(LeaveRequestStatus v){status=v;}
    public String getAdminNote(){return adminNote;} public void setAdminNote(String v){adminNote=v;}
    public String getReviewedByEmail(){return reviewedByEmail;} public void setReviewedByEmail(String v){reviewedByEmail=v;}
    public LocalDateTime getReviewedAt(){return reviewedAt;} public void setReviewedAt(LocalDateTime v){reviewedAt=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
