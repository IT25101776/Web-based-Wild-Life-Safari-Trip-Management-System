package com.safarilanka.model;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="permits")
public class Permit {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true) private String permitCode;
 @OneToOne(fetch=FetchType.EAGER,optional=false) private Booking booking;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private PermitStatus status=PermitStatus.PENDING;
 private String gateName="Yala Palatupana Gate";
 @Column(length=1000) private String decisionReason;
 private String decisionByEmail;
 private String decisionByName;
 private String decisionByRole;
 private String checkedInByEmail;
 private String checkedOutByEmail;
 private LocalDateTime issuedAt;
 private LocalDateTime checkedInAt;
 private LocalDateTime checkedOutAt;
 private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;}
 public String getPermitCode(){return permitCode;} public void setPermitCode(String v){permitCode=v;}
 public Booking getBooking(){return booking;} public void setBooking(Booking v){booking=v;}
 public PermitStatus getStatus(){return status;} public void setStatus(PermitStatus v){status=v;}
 public String getGateName(){return gateName;} public void setGateName(String v){gateName=v;}
 public String getDecisionReason(){return decisionReason;} public void setDecisionReason(String v){decisionReason=v;}
 public String getDecisionByEmail(){return decisionByEmail;} public void setDecisionByEmail(String v){decisionByEmail=v;}
 public String getDecisionByName(){return decisionByName;} public void setDecisionByName(String v){decisionByName=v;}
 public String getDecisionByRole(){return decisionByRole;} public void setDecisionByRole(String v){decisionByRole=v;}
 public String getCheckedInByEmail(){return checkedInByEmail;} public void setCheckedInByEmail(String v){checkedInByEmail=v;}
 public String getCheckedOutByEmail(){return checkedOutByEmail;} public void setCheckedOutByEmail(String v){checkedOutByEmail=v;}
 public LocalDateTime getIssuedAt(){return issuedAt;} public void setIssuedAt(LocalDateTime v){issuedAt=v;}
 public LocalDateTime getCheckedInAt(){return checkedInAt;} public void setCheckedInAt(LocalDateTime v){checkedInAt=v;}
 public LocalDateTime getCheckedOutAt(){return checkedOutAt;} public void setCheckedOutAt(LocalDateTime v){checkedOutAt=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
