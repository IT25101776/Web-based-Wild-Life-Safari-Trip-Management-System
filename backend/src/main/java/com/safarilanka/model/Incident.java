package com.safarilanka.model;
import jakarta.persistence.*; import java.time.*;
@Entity @Table(name="incidents")
public class Incident {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private Booking booking;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private User reporter;
 private String type; @Column(length=1800) private String details;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private IncidentStatus status=IncidentStatus.OPEN;
 private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public Booking getBooking(){return booking;} public void setBooking(Booking v){booking=v;}
 public User getReporter(){return reporter;} public void setReporter(User v){reporter=v;} public String getType(){return type;} public void setType(String v){type=v;}
 public String getDetails(){return details;} public void setDetails(String v){details=v;} public IncidentStatus getStatus(){return status;} public void setStatus(IncidentStatus v){status=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
