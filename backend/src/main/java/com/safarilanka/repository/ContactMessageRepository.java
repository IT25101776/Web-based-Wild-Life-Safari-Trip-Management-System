package com.safarilanka.repository;
import com.safarilanka.model.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ContactMessageRepository extends JpaRepository<ContactMessage,Long>{
 List<ContactMessage> findAllByOrderByCreatedAtDesc();
}
