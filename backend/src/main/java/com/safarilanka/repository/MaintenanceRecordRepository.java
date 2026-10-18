package com.safarilanka.repository;
import com.safarilanka.model.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord,Long>{ List<MaintenanceRecord> findByVehicleIdOrderByServiceDateDesc(Long vehicleId); }
