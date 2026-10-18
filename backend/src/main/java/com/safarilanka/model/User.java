package com.safarilanka.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String fullName;
    @Column(nullable = false, unique = true) private String email;
    @JsonIgnore @Column(nullable = false) private String password;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
    private String phone;
    private String address;
    private String country;
    private String preferredCurrency;
    private String preferredLanguage = "ENGLISH";
    private String gender;
    private LocalDate birthDate;
    private String identityType;
    private String identityNumber;
    @Column(nullable = false) private boolean active = true;
    @Column(nullable = false) private boolean available = true;
    @Column(nullable = false) private boolean onLeave = false;
    @Column(nullable = false) private boolean archived = false;
    private LocalDateTime archivedAt;
    private String qualifications;
    private String languages;
    private String licenseNumber;
    @Column(length=1000) private String profileImageUrl;
    private LocalDateTime createdAt;

    @PrePersist public void prePersist(){ if(createdAt==null) createdAt=LocalDateTime.now(); if(preferredLanguage==null||preferredLanguage.isBlank()) preferredLanguage="ENGLISH"; }
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getFullName(){return fullName;} public void setFullName(String v){fullName=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getPassword(){return password;} public void setPassword(String v){password=v;}
    public Role getRole(){return role;} public void setRole(Role v){role=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getAddress(){return address;} public void setAddress(String v){address=v;}
    public String getCountry(){return country;} public void setCountry(String v){country=v;}
    public String getPreferredCurrency(){return preferredCurrency;} public void setPreferredCurrency(String v){preferredCurrency=v;}
    public String getPreferredLanguage(){return preferredLanguage;} public void setPreferredLanguage(String v){preferredLanguage=v;}
    public String getGender(){return gender;} public void setGender(String v){gender=v;}
    public LocalDate getBirthDate(){return birthDate;} public void setBirthDate(LocalDate v){birthDate=v;}
    public String getIdentityType(){return identityType;} public void setIdentityType(String v){identityType=v;}
    public String getIdentityNumber(){return identityNumber;} public void setIdentityNumber(String v){identityNumber=v;}
    public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
    public boolean isAvailable(){return available;} public void setAvailable(boolean v){available=v;}
    public boolean isOnLeave(){return onLeave;} public void setOnLeave(boolean v){onLeave=v;}
    public boolean isArchived(){return archived;} public void setArchived(boolean v){archived=v;}
    public LocalDateTime getArchivedAt(){return archivedAt;} public void setArchivedAt(LocalDateTime v){archivedAt=v;}
    public String getQualifications(){return qualifications;} public void setQualifications(String v){qualifications=v;}
    public String getLanguages(){return languages;} public void setLanguages(String v){languages=v;}
    public String getLicenseNumber(){return licenseNumber;} public void setLicenseNumber(String v){licenseNumber=v;}
    public String getProfileImageUrl(){return profileImageUrl;} public void setProfileImageUrl(String v){profileImageUrl=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
