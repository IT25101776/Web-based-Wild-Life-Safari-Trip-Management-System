package com.safarilanka.repository;
import com.safarilanka.model.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface PermitRepository extends JpaRepository<Permit,Long>{ Optional<Permit> findByPermitCodeIgnoreCase(String code); Optional<Permit> findByBookingId(Long bookingId); List<Permit> findByBookingTouristEmailOrderByCreatedAtDesc(String email); List<Permit> findByStatusOrderByCreatedAtAsc(PermitStatus status); }
