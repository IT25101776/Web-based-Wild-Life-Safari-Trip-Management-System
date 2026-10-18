package com.safarilanka.model;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="vehicles")
public class Vehicle {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true) private String registrationNo;
 private String model;
 @Column(nullable=false) private int capacity;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private VehicleStatus status=VehicleStatus.AVAILABLE;
 private LocalDate documentValidUntil;
 @ManyToOne(fetch=FetchType.EAGER) private User driver;
 private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public String getRegistrationNo(){return registrationNo;} public void setRegistrationNo(String v){registrationNo=v;}
 public String getModel(){return model;} public void setModel(String v){model=v;} public int getCapacity(){return capacity;} public void setCapacity(int v){capacity=v;}
 public VehicleStatus getStatus(){return status;} public void setStatus(VehicleStatus v){status=v;} public LocalDate getDocumentValidUntil(){return documentValidUntil;} public void setDocumentValidUntil(LocalDate v){documentValidUntil=v;}
 public User getDriver(){return driver;} public void setDriver(User v){driver=v;} public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
