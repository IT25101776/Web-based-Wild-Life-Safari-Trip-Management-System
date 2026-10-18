package com.safarilanka.model;
import jakarta.persistence.*;
import java.math.*; import java.time.*;
@Entity @Table(name="refund_requests")
public class RefundRequest {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private Booking booking;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private Payment payment;
 @Column(nullable=false,precision=12,scale=2) private BigDecimal amount;
 @Column(length=1000) private String reason;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private RefundStatus status=RefundStatus.PENDING;
 private String decisionNote; private LocalDateTime createdAt; private LocalDateTime decidedAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public Booking getBooking(){return booking;} public void setBooking(Booking v){booking=v;}
 public Payment getPayment(){return payment;} public void setPayment(Payment v){payment=v;} public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal v){amount=v;}
 public String getReason(){return reason;} public void setReason(String v){reason=v;} public RefundStatus getStatus(){return status;} public void setStatus(RefundStatus v){status=v;}
 public String getDecisionNote(){return decisionNote;} public void setDecisionNote(String v){decisionNote=v;} public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
 public LocalDateTime getDecidedAt(){return decidedAt;} public void setDecidedAt(LocalDateTime v){decidedAt=v;}
}
