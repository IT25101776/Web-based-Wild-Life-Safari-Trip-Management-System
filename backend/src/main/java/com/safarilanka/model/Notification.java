package com.safarilanka.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="notifications")
public class Notification {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.EAGER, optional=false) private User recipient;
    @ManyToOne(fetch=FetchType.EAGER) private User sender;
    @Column(nullable=false, length=180) private String title;
    @Column(nullable=false, length=2500) private String message;
    @Column(nullable=false, length=60) private String category="SYSTEM";
    @Column(nullable=false) private boolean readFlag=false;
    private LocalDateTime createdAt;
    @PrePersist void pre(){if(createdAt==null)createdAt=LocalDateTime.now();}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public User getRecipient(){return recipient;} public void setRecipient(User v){recipient=v;}
    public User getSender(){return sender;} public void setSender(User v){sender=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getMessage(){return message;} public void setMessage(String v){message=v;}
    public String getCategory(){return category;} public void setCategory(String v){category=v;}
    public boolean isReadFlag(){return readFlag;} public void setReadFlag(boolean v){readFlag=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
