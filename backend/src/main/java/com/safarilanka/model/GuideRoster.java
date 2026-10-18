package com.safarilanka.model;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name="guide_rosters", uniqueConstraints=@UniqueConstraint(name="uk_guide_roster_slot", columnNames={"guide_id","roster_date","shift"}))
public class GuideRoster {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch=FetchType.EAGER, optional=false)
    private User guide;
    @Column(nullable=false)
    private LocalDate rosterDate;
    @Column(nullable=false, length=30)
    private String shift;
    @Column(nullable=false)
    private boolean available=true;
    @Column(length=500)
    private String notes;
    @Column(nullable=false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist void prePersist(){
        if(createdAt==null) createdAt=LocalDateTime.now();
        updatedAt=LocalDateTime.now();
    }
    @PreUpdate void preUpdate(){updatedAt=LocalDateTime.now();}

    public Long getId(){return id;} public void setId(Long v){id=v;}
    public User getGuide(){return guide;} public void setGuide(User v){guide=v;}
    public LocalDate getRosterDate(){return rosterDate;} public void setRosterDate(LocalDate v){rosterDate=v;}
    public String getShift(){return shift;} public void setShift(String v){shift=v;}
    public boolean isAvailable(){return available;} public void setAvailable(boolean v){available=v;}
    public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
}
