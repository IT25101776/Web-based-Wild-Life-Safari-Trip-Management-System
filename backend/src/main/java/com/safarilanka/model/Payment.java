package com.safarilanka.model;
import jakarta.persistence.*;
import java.math.*; import java.time.*;
@Entity @Table(name="payments")
public class Payment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true) private String paymentCode;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private Booking booking;
 @Column(nullable=false,precision=12,scale=2) private BigDecimal amount;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private PaymentMethod method;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private PaymentStatus status;
 private String transactionReference; private String invoiceNumber; private String cardBrand; private String cardLast4; private String bankSlipFileName; @Column(length=1000) private String bankSlipPath; @Column(length=1000) private String reviewNote; @Column(length=1000) private String rejectionReason; private String reviewedBy; private LocalDateTime reviewedAt; private LocalDateTime paidAt; private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public String getPaymentCode(){return paymentCode;} public void setPaymentCode(String v){paymentCode=v;}
 public Booking getBooking(){return booking;} public void setBooking(Booking v){booking=v;} public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal v){amount=v;}
 public PaymentMethod getMethod(){return method;} public void setMethod(PaymentMethod v){method=v;} public PaymentStatus getStatus(){return status;} public void setStatus(PaymentStatus v){status=v;}
 public String getTransactionReference(){return transactionReference;} public void setTransactionReference(String v){transactionReference=v;} public String getInvoiceNumber(){return invoiceNumber;} public void setInvoiceNumber(String v){invoiceNumber=v;}
 public String getCardBrand(){return cardBrand;} public void setCardBrand(String v){cardBrand=v;} public String getCardLast4(){return cardLast4;} public void setCardLast4(String v){cardLast4=v;} public String getBankSlipFileName(){return bankSlipFileName;} public void setBankSlipFileName(String v){bankSlipFileName=v;} public String getBankSlipPath(){return bankSlipPath;} public void setBankSlipPath(String v){bankSlipPath=v;} public String getReviewNote(){return reviewNote;} public void setReviewNote(String v){reviewNote=v;} public String getRejectionReason(){return rejectionReason;} public void setRejectionReason(String v){rejectionReason=v;} public String getReviewedBy(){return reviewedBy;} public void setReviewedBy(String v){reviewedBy=v;} public LocalDateTime getReviewedAt(){return reviewedAt;} public void setReviewedAt(LocalDateTime v){reviewedAt=v;} public LocalDateTime getPaidAt(){return paidAt;} public void setPaidAt(LocalDateTime v){paidAt=v;} public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
