package com.safarilanka.repository;
import com.safarilanka.model.*; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param; import java.util.*; import java.time.LocalDate;
public interface TripAssignmentRepository extends JpaRepository<TripAssignment,Long>{
 List<TripAssignment> findByBookingIdOrderByIdAsc(Long bookingId);
 @Query("select a from TripAssignment a where a.driver.email=:email or a.guide.email=:email order by a.booking.visitDate desc") List<TripAssignment> findForStaff(@Param("email") String email);
 @Query("select a from TripAssignment a where a.guide.id=:guideId and a.booking.visitDate=:date") List<TripAssignment> findByGuideIdAndBookingVisitDate(@Param("guideId") Long guideId,@Param("date") LocalDate date);
 @Query("select a from TripAssignment a where a.driver.id=:driverId and a.booking.visitDate=:date") List<TripAssignment> findByDriverIdAndBookingVisitDate(@Param("driverId") Long driverId,@Param("date") LocalDate date);
 @Query("select a from TripAssignment a where a.vehicle.id=:vehicleId and a.booking.visitDate=:date") List<TripAssignment> findByVehicleIdAndBookingVisitDate(@Param("vehicleId") Long vehicleId,@Param("date") LocalDate date);
}
