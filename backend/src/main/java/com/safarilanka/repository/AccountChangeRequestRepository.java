package com.safarilanka.repository;

import com.safarilanka.model.AccountChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface AccountChangeRequestRepository extends JpaRepository<AccountChangeRequest,Long> {
    List<AccountChangeRequest> findTop20ByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    List<AccountChangeRequest> findAllByOrderByCreatedAtDesc();
    boolean existsByRequesterIdAndStatus(Long requesterId,String status);
}
