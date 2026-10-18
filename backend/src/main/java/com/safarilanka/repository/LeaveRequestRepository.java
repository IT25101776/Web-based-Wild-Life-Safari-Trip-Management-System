package com.safarilanka.repository;

import com.safarilanka.model.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.*;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest,Long> {
    List<LeaveRequest> findByRequesterEmailOrderByCreatedAtDesc(String email);
    List<LeaveRequest> findAllByOrderByCreatedAtDesc();
    boolean existsByRequesterIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long requesterId, LeaveRequestStatus status, LocalDate end, LocalDate start);
    @Query("select l from LeaveRequest l where l.requester.id=:userId and l.status='APPROVED' and l.startDate<=:date and l.endDate>=:date")
    List<LeaveRequest> findApprovedForDate(@Param("userId") Long userId,@Param("date") LocalDate date);
}
