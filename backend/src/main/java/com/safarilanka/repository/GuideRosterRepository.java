package com.safarilanka.repository;

import com.safarilanka.model.GuideRoster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.*;

public interface GuideRosterRepository extends JpaRepository<GuideRoster,Long> {
    List<GuideRoster> findByGuideEmailOrderByRosterDateAsc(String email);
    List<GuideRoster> findByGuideIdAndRosterDate(Long guideId, LocalDate rosterDate);
    List<GuideRoster> findAllByOrderByRosterDateAsc();
    boolean existsByGuideIdAndRosterDateAndShiftIgnoreCase(Long guideId, LocalDate rosterDate, String shift);
}
