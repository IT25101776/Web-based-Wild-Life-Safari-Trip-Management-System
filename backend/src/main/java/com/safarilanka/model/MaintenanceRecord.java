package com.safarilanka.model;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="maintenance_records")
public class MaintenanceRecord {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) private Vehicle vehicle;
 @Column(nullable=false) private LocalDate serviceDate;
 @Column(length=1000) private String description;
 private String status;
 private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public Vehicle getVehicle(){return vehicle;} public void setVehicle(Vehicle v){vehicle=v;}
 public LocalDate getServiceDate(){return serviceDate;} public void setServiceDate(LocalDate v){serviceDate=v;} public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;} public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
