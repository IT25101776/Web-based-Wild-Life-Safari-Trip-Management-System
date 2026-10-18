package com.safarilanka.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name="safari_packages")
public class SafariPackage {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false, unique=true) private String name;
 @Column(length=1800) private String description;
 private String routeZone;
 private String timeSlot;
 @Column(nullable=false, precision=12, scale=2) private BigDecimal pricePerPerson;
 @Column(precision=12, scale=2) private BigDecimal additionalVehicleFee=BigDecimal.ZERO;
 @Column(nullable=false) private int maxVisitors;
 @Column(nullable=false) private int maxVehicles;
 @Column(nullable=false) private boolean published=true;
 @Column(nullable=false) private boolean deleted=false;
 @Column(length=1000) private String imageUrl;
 @Column(length=1000) private String videoUrl;
 private String duration;
 private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public String getName(){return name;} public void setName(String v){name=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;} public String getRouteZone(){return routeZone;} public void setRouteZone(String v){routeZone=v;}
 public String getTimeSlot(){return timeSlot;} public void setTimeSlot(String v){timeSlot=v;} public BigDecimal getPricePerPerson(){return pricePerPerson;} public void setPricePerPerson(BigDecimal v){pricePerPerson=v;}
 public BigDecimal getAdditionalVehicleFee(){return additionalVehicleFee;} public void setAdditionalVehicleFee(BigDecimal v){additionalVehicleFee=v==null?BigDecimal.ZERO:v;}
 public int getMaxVisitors(){return maxVisitors;} public void setMaxVisitors(int v){maxVisitors=v;} public int getMaxVehicles(){return maxVehicles;} public void setMaxVehicles(int v){maxVehicles=v;}
 public boolean isPublished(){return published;} public void setPublished(boolean v){published=v;} public boolean isDeleted(){return deleted;} public void setDeleted(boolean v){deleted=v;} public String getImageUrl(){return imageUrl;} public void setImageUrl(String v){imageUrl=v;}
 public String getVideoUrl(){return videoUrl;} public void setVideoUrl(String v){videoUrl=v;}
 public String getDuration(){return duration;} public void setDuration(String v){duration=v;} public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
