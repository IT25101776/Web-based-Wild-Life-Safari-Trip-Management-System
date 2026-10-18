package com.safarilanka.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
@Entity @Table(name="bookings")
public class Booking {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false, unique=true) private String bookingCode;
 @ManyToOne(fetch=FetchType.EAGER, optional=false) private User tourist;
 @ManyToOne(fetch=FetchType.EAGER, optional=false) private SafariPackage safariPackage;
 @Column(nullable=false) private LocalDate visitDate;
 @Column(nullable=false) private int visitorCount;
 @Column(nullable=false) private int adultCount=1;
 @Column(nullable=false) private int childFiveToElevenCount=0;
 @Column(nullable=false) private int childBelowFiveCount=0;
 private String groupLeaderName; private String contactPhone; private String emergencyContact;
 @Column(length=1500) private String specialRequirements;
 @Column(length=1000) private String cancellationReason;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private BookingStatus bookingStatus=BookingStatus.PENDING;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private PaymentStatus paymentStatus=PaymentStatus.UNPAID;
 @Column(nullable=false,precision=12,scale=2) private BigDecimal totalAmount;
 @Column private int vehicleCount=1;
 @Column(precision=12,scale=2) private BigDecimal vehicleSurcharge=BigDecimal.ZERO;
 private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public String getBookingCode(){return bookingCode;} public void setBookingCode(String v){bookingCode=v;}
 public User getTourist(){return tourist;} public void setTourist(User v){tourist=v;} public SafariPackage getSafariPackage(){return safariPackage;} public void setSafariPackage(SafariPackage v){safariPackage=v;}
 public LocalDate getVisitDate(){return visitDate;} public void setVisitDate(LocalDate v){visitDate=v;} public int getVisitorCount(){return visitorCount;} public void setVisitorCount(int v){visitorCount=v;}
 public int getAdultCount(){return adultCount;} public void setAdultCount(int v){adultCount=v;}
 public int getChildFiveToElevenCount(){return childFiveToElevenCount;} public void setChildFiveToElevenCount(int v){childFiveToElevenCount=v;}
 public int getChildBelowFiveCount(){return childBelowFiveCount;} public void setChildBelowFiveCount(int v){childBelowFiveCount=v;}
 public String getGroupLeaderName(){return groupLeaderName;} public void setGroupLeaderName(String v){groupLeaderName=v;} public String getContactPhone(){return contactPhone;} public void setContactPhone(String v){contactPhone=v;}
 public String getEmergencyContact(){return emergencyContact;} public void setEmergencyContact(String v){emergencyContact=v;} public String getSpecialRequirements(){return specialRequirements;} public void setSpecialRequirements(String v){specialRequirements=v;}
 public String getCancellationReason(){return cancellationReason;} public void setCancellationReason(String v){cancellationReason=v;}
 public BookingStatus getBookingStatus(){return bookingStatus;} public void setBookingStatus(BookingStatus v){bookingStatus=v;} public PaymentStatus getPaymentStatus(){return paymentStatus;} public void setPaymentStatus(PaymentStatus v){paymentStatus=v;}
 public BigDecimal getTotalAmount(){return totalAmount;} public void setTotalAmount(BigDecimal v){totalAmount=v;}
 public int getVehicleCount(){return vehicleCount;} public void setVehicleCount(int v){vehicleCount=v;}
 public BigDecimal getVehicleSurcharge(){return vehicleSurcharge;} public void setVehicleSurcharge(BigDecimal v){vehicleSurcharge=v==null?BigDecimal.ZERO:v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
