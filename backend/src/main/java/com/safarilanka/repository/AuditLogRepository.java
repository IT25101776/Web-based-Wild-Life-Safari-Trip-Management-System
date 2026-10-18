package com.safarilanka.repository;
import com.safarilanka.model.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface AuditLogRepository extends JpaRepository<AuditLog,Long>{ List<AuditLog> findTop100ByOrderByCreatedAtDesc(); }
