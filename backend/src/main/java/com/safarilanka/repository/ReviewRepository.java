package com.safarilanka.repository;
import com.safarilanka.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ReviewRepository extends JpaRepository<Review,Long>{
 List<Review> findByPublishedTrueOrderByCreatedAtDesc();
 List<Review> findByTouristEmailOrderByCreatedAtDesc(String email);
 boolean existsByBookingId(Long bookingId);
 Optional<Review> findByBookingId(Long bookingId);
}
