package com.safarilanka.repository;
import com.safarilanka.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface VehicleRepository extends JpaRepository<Vehicle,Long>{
 Optional<Vehicle> findByRegistrationNoIgnoreCase(String registrationNo);
 List<Vehicle> findByDriverEmail(String email);
 List<Vehicle> findByDriverId(Long driverId);
 Optional<Vehicle> findFirstByDriverId(Long driverId);
}
