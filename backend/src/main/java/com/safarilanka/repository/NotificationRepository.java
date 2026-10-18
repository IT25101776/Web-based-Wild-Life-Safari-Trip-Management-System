package com.safarilanka.repository;
import com.safarilanka.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification,Long> {
    List<Notification> findTop100ByRecipientEmailOrderByCreatedAtDesc(String email);
    long countByRecipientEmailAndReadFlagFalse(String email);
}
