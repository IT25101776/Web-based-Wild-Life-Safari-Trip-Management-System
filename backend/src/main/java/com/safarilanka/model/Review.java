package com.safarilanka.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="reviews", uniqueConstraints=@UniqueConstraint(name="uk_review_booking", columnNames="booking_id"))
public class Review {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.EAGER, optional=false) @JoinColumn(name="booking_id", nullable=false) private Booking booking;
 @ManyToOne(fetch=FetchType.EAGER, optional=false) @JoinColumn(name="tourist_id", nullable=false) private User tourist;
 @ManyToOne(fetch=FetchType.EAGER, optional=false) @JoinColumn(name="package_id", nullable=false) private SafariPackage safariPackage;
 @Column(nullable=false) private int overallRating;
 private Integer driverRating;
 private Integer guideRating;
 @Column(length=180) private String title;
 @Column(length=4000, nullable=false) private String reviewText;
 @Column(length=2000) private String driverReview;
 @Column(length=2000) private String guideReview;
 @Lob @Column(columnDefinition="LONGTEXT") private String mediaUrls;
 @Column(nullable=false) private boolean published=true;
 private LocalDateTime createdAt;
 @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;}
 public Booking getBooking(){return booking;} public void setBooking(Booking v){booking=v;}
 public User getTourist(){return tourist;} public void setTourist(User v){tourist=v;}
 public SafariPackage getSafariPackage(){return safariPackage;} public void setSafariPackage(SafariPackage v){safariPackage=v;}
 public int getOverallRating(){return overallRating;} public void setOverallRating(int v){overallRating=v;}
 public Integer getDriverRating(){return driverRating;} public void setDriverRating(Integer v){driverRating=v;}
 public Integer getGuideRating(){return guideRating;} public void setGuideRating(Integer v){guideRating=v;}
 public String getTitle(){return title;} public void setTitle(String v){title=v;}
 public String getReviewText(){return reviewText;} public void setReviewText(String v){reviewText=v;}
 public String getDriverReview(){return driverReview;} public void setDriverReview(String v){driverReview=v;}
 public String getGuideReview(){return guideReview;} public void setGuideReview(String v){guideReview=v;}
 public String getMediaUrls(){return mediaUrls;} public void setMediaUrls(String v){mediaUrls=v;}
 public boolean isPublished(){return published;} public void setPublished(boolean v){published=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
