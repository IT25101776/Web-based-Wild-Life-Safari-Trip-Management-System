package com.safarilanka.repository;
import com.safarilanka.model.SystemSetting; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface SystemSettingRepository extends JpaRepository<SystemSetting,Long>{Optional<SystemSetting> findBySettingKey(String settingKey);}
