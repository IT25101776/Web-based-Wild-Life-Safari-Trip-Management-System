package com.safarilanka.model;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name="gate_compliance_records")
public class GateComplianceRecord {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch=FetchType.EAGER,optional=false)
    private Permit permit;
    @ManyToOne(fetch=FetchType.EAGER,optional=false)
    private User officer;
    @Column(nullable=false) private String gateName;
    private String vehicleRegistration;
    @Column(nullable=false) private LocalDateTime inspectionDate;
    @Column(nullable=false) private boolean permitVerified;
    @Column(nullable=false) private boolean visitorCountVerified;
    @Column(nullable=false) private boolean vehicleVerified;
    @Column(nullable=false) private boolean guideVerified;
    @Column(nullable=false) private boolean driverVerified;
    @Column(nullable=false,length=30) private String complianceStatus="PENDING";
    @Column(nullable=false,length=20) private String recordStatus="DRAFT";
    @Column(length=1500) private String notes;
    @Column(nullable=false) private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist void prePersist(){if(inspectionDate==null)inspectionDate=LocalDateTime.now();if(createdAt==null)createdAt=LocalDateTime.now();updatedAt=LocalDateTime.now();}
    @PreUpdate void preUpdate(){updatedAt=LocalDateTime.now();}

    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Permit getPermit(){return permit;} public void setPermit(Permit v){permit=v;}
    public User getOfficer(){return officer;} public void setOfficer(User v){officer=v;}
    public String getGateName(){return gateName;} public void setGateName(String v){gateName=v;}
    public String getVehicleRegistration(){return vehicleRegistration;} public void setVehicleRegistration(String v){vehicleRegistration=v;}
    public LocalDateTime getInspectionDate(){return inspectionDate;} public void setInspectionDate(LocalDateTime v){inspectionDate=v;}
    public boolean isPermitVerified(){return permitVerified;} public void setPermitVerified(boolean v){permitVerified=v;}
    public boolean isVisitorCountVerified(){return visitorCountVerified;} public void setVisitorCountVerified(boolean v){visitorCountVerified=v;}
    public boolean isVehicleVerified(){return vehicleVerified;} public void setVehicleVerified(boolean v){vehicleVerified=v;}
    public boolean isGuideVerified(){return guideVerified;} public void setGuideVerified(boolean v){guideVerified=v;}
    public boolean isDriverVerified(){return driverVerified;} public void setDriverVerified(boolean v){driverVerified=v;}
    public String getComplianceStatus(){return complianceStatus;} public void setComplianceStatus(String v){complianceStatus=v;}
    public String getRecordStatus(){return recordStatus;} public void setRecordStatus(String v){recordStatus=v;}
    public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
}
