package com.safarilanka.model;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="trip_assignments")
public class TripAssignment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private Booking booking;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private Vehicle vehicle;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private User driver;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private User guide;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private AssignmentStatus status=AssignmentStatus.ASSIGNED;
 private LocalDateTime assignedAt;
 @Transient private Permit permit;
 @PrePersist void pre(){if(assignedAt==null)assignedAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public Booking getBooking(){return booking;} public void setBooking(Booking v){booking=v;}
 public Vehicle getVehicle(){return vehicle;} public void setVehicle(Vehicle v){vehicle=v;} public User getDriver(){return driver;} public void setDriver(User v){driver=v;}
 public User getGuide(){return guide;} public void setGuide(User v){guide=v;} public AssignmentStatus getStatus(){return status;} public void setStatus(AssignmentStatus v){status=v;}
 public LocalDateTime getAssignedAt(){return assignedAt;} public void setAssignedAt(LocalDateTime v){assignedAt=v;}
 public Permit getPermit(){return permit;} public void setPermit(Permit v){permit=v;}
}
