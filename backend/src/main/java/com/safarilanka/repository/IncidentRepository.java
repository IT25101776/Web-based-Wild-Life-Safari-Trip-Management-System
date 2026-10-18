package com.safarilanka.repository;
import com.safarilanka.model.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface IncidentRepository extends JpaRepository<Incident,Long>{ List<Incident> findByReporterEmailOrderByCreatedAtDesc(String email); }
