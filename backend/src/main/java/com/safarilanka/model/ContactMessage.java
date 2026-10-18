package com.safarilanka.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="contact_messages")
public class ContactMessage {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=120) private String fullName;
 @Column(nullable=false,length=180) private String email;
 @Column(length=30) private String phone;
 @Column(length=40) private String bookingCode;
 @Column(nullable=false,length=160) private String subject;
 @Column(nullable=false,length=3000) private String message;
 @Column(nullable=false,length=20) private String status="NEW";
 private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now(); if(status==null||status.isBlank())status="NEW";}
 public Long getId(){return id;} public void setId(Long v){id=v;}
 public String getFullName(){return fullName;} public void setFullName(String v){fullName=v;}
 public String getEmail(){return email;} public void setEmail(String v){email=v;}
 public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
 public String getBookingCode(){return bookingCode;} public void setBookingCode(String v){bookingCode=v;}
 public String getSubject(){return subject;} public void setSubject(String v){subject=v;}
 public String getMessage(){return message;} public void setMessage(String v){message=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
