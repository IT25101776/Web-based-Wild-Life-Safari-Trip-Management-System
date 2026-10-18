package com.safarilanka.repository;
import com.safarilanka.model.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface RefundRequestRepository extends JpaRepository<RefundRequest,Long>{ List<RefundRequest> findByBookingTouristEmailOrderByCreatedAtDesc(String email); boolean existsByBookingIdAndStatus(Long bookingId, RefundStatus status); }
