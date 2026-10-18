package com.safarilanka.repository;
import com.safarilanka.model.*; import org.springframework.data.jpa.repository.JpaRepository; import java.time.*; import java.util.*;
public interface BookingRepository extends JpaRepository<Booking,Long>{ List<Booking> findByTouristEmailOrderByCreatedAtDesc(String email); List<Booking> findBySafariPackageIdAndVisitDate(Long packageId, LocalDate visitDate); Optional<Booking> findByBookingCode(String code); }
