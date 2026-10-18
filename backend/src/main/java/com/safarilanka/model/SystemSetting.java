package com.safarilanka.model;
import jakarta.persistence.*;
@Entity @Table(name="system_settings")
public class SystemSetting {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true) private String settingKey;
 @Column(length=2000) private String settingValue;
 private String description;
 public Long getId(){return id;} public void setId(Long v){id=v;} public String getSettingKey(){return settingKey;} public void setSettingKey(String v){settingKey=v;}
 public String getSettingValue(){return settingValue;} public void setSettingValue(String v){settingValue=v;} public String getDescription(){return description;} public void setDescription(String v){description=v;}
}
