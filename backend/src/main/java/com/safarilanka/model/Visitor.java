package com.safarilanka.model;
import jakarta.persistence.*;
@Entity @Table(name="visitors")
public class Visitor {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.EAGER, optional=false) private Booking booking;
 @Column(nullable=false) private String fullName; private String idType; private String idNumber; private String nationality; private Integer age;
 public Long getId(){return id;} public void setId(Long v){id=v;} public Booking getBooking(){return booking;} public void setBooking(Booking v){booking=v;}
 public String getFullName(){return fullName;} public void setFullName(String v){fullName=v;} public String getIdType(){return idType;} public void setIdType(String v){idType=v;} public String getIdNumber(){return idNumber;} public void setIdNumber(String v){idNumber=v;}
 public String getNationality(){return nationality;} public void setNationality(String v){nationality=v;} public Integer getAge(){return age;} public void setAge(Integer v){age=v;}
}
