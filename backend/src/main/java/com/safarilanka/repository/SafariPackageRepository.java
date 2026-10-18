package com.safarilanka.repository;
import com.safarilanka.model.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface SafariPackageRepository extends JpaRepository<SafariPackage,Long>{
 List<SafariPackage> findByPublishedTrueAndDeletedFalseOrderByIdAsc();
 List<SafariPackage> findByDeletedFalseOrderByIdAsc();
 boolean existsByNameIgnoreCase(String name);
}
