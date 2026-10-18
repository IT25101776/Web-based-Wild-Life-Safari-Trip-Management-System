package com.safarilanka.repository;

import com.safarilanka.model.GateComplianceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface GateComplianceRecordRepository extends JpaRepository<GateComplianceRecord,Long> {
    List<GateComplianceRecord> findByOfficerEmailOrderByCreatedAtDesc(String email);
    List<GateComplianceRecord> findAllByOrderByCreatedAtDesc();
}
