package com.safarilanka.repository;
import com.safarilanka.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PaymentRepository extends JpaRepository<Payment,Long>{
 List<Payment> findByBookingTouristEmailOrderByCreatedAtDesc(String email);
 List<Payment> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
 Optional<Payment> findFirstByBookingIdOrderByCreatedAtDesc(Long bookingId);
 Optional<Payment> findFirstByBookingIdAndStatusOrderByCreatedAtDesc(Long bookingId, PaymentStatus status);
}
