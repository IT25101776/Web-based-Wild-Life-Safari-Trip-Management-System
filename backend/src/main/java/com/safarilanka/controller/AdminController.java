package com.safarilanka.controller;

import com.safarilanka.dto.UserCreateRequest;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.AccountDeletionService;
import com.safarilanka.service.AuditService;
import com.safarilanka.service.UserProfileRules;
import com.safarilanka.service.RoleLoginEmailPolicy;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AdminController {
    private final UserRepository users;
    private final VehicleRepository vehicles;
    private final AuditLogRepository logs;
    private final SystemSettingRepository settings;
    private final PasswordEncoder encoder;
    private final AuditService audit;
    private final AccountDeletionService accountDeletion;

    public AdminController(UserRepository u, VehicleRepository v, AuditLogRepository l,
                           SystemSettingRepository s, PasswordEncoder e, AuditService a, AccountDeletionService accountDeletion) {
        users=u; vehicles=v; logs=l; settings=s; encoder=e; audit=a; this.accountDeletion=accountDeletion;
    }

    @GetMapping("/users")
    public List<User> users(){return users.findAll();}

    @PostMapping("/users")
    public User create(@Valid @RequestBody UserCreateRequest r, Authentication a){
        if(!RoleLoginEmailPolicy.isStaffRole(r.role()))
            throw new IllegalArgumentException("Tourist accounts are created from the public registration page. Select a staff role.");
        String requiredEmail=RoleLoginEmailPolicy.emailFor(r.fullName(),r.role());
        if(r.email()==null || !requiredEmail.equalsIgnoreCase(r.email().trim()))
            throw new IllegalArgumentException("This role login email must be "+requiredEmail);
        if(users.existsByEmailIgnoreCase(requiredEmail))
            throw new IllegalArgumentException("A login with this role email already exists");

        User u=new User();
        u.setFullName(r.fullName());
        u.setEmail(requiredEmail);
        u.setPassword(encoder.encode(r.password()));
        u.setRole(r.role());
        u.setPhone(r.phone());
        UserProfileRules.apply(u,r.fullName(),r.phone(),r.address(),r.qualifications(),r.languages(),r.licenseNumber());
        users.save(u);

        if (u.getRole()==Role.JEEP_DRIVER && r.vehicleId()!=null) {
            assignVehicleToDriver(u,r.vehicleId());
        }

        audit.log(a.getName(),"USER_CREATE",u.getEmail()+" / "+u.getRole()+(r.vehicleId()==null?"":" / vehicle="+r.vehicleId()));
        return u;
    }

    @PatchMapping("/users/{id}")
    public User update(@PathVariable Long id,@RequestBody Map<String,String> b,Authentication a){
        User u=users.findById(id).orElseThrow(()->new IllegalArgumentException("User not found"));
        Role originalRole=u.getRole();
        String originalName=u.getFullName();

        if(b.containsKey("fullName"))u.setFullName(b.get("fullName").trim().replaceAll("\\s+"," "));
        if(b.containsKey("role"))u.setRole(Role.valueOf(b.get("role")));
        if(b.containsKey("active"))u.setActive(Boolean.parseBoolean(b.get("active")));
        if(b.containsKey("available"))u.setAvailable(Boolean.parseBoolean(b.get("available")));
        if(b.containsKey("onLeave"))u.setOnLeave(Boolean.parseBoolean(b.get("onLeave")));
        if(b.containsKey("phone"))u.setPhone(b.get("phone"));
        if(b.containsKey("address"))u.setAddress(b.get("address"));
        if(b.containsKey("qualifications"))u.setQualifications(b.get("qualifications"));
        if(b.containsKey("languages"))u.setLanguages(b.get("languages"));
        if(b.containsKey("licenseNumber"))u.setLicenseNumber(b.get("licenseNumber"));
        if(b.containsKey("password") && b.get("password")!=null && !b.get("password").isBlank()){
            if(b.get("password").length()<6) throw new IllegalArgumentException("Password must contain at least 6 characters");
            u.setPassword(encoder.encode(b.get("password")));
        }

        boolean profileChange=b.keySet().stream().anyMatch(k->!Set.of("active","available","onLeave","vehicleId").contains(k));
        if(profileChange) UserProfileRules.normalizeForRole(u);

        boolean nameChanged=!Objects.equals(originalName,u.getFullName());
        boolean roleChanged=u.getRole()!=originalRole;
        if((nameChanged||roleChanged) && RoleLoginEmailPolicy.isStaffRole(u.getRole())){
            String nextEmail=RoleLoginEmailPolicy.emailFor(u.getFullName(),u.getRole());
            Optional<User> existing=users.findByEmailIgnoreCase(nextEmail);
            if(existing.isPresent() && !existing.get().getId().equals(u.getId()))
                throw new IllegalArgumentException("The generated role login email already exists: "+nextEmail);
            u.setEmail(nextEmail);
        }

        users.save(u);

        if (originalRole==Role.JEEP_DRIVER && u.getRole()!=Role.JEEP_DRIVER) {
            unlinkDriverVehicles(u.getId());
        }
        if (u.getRole()==Role.JEEP_DRIVER && b.containsKey("vehicleId")) {
            String raw=b.get("vehicleId");
            Long vehicleId=(raw==null||raw.isBlank())?null:Long.valueOf(raw);
            assignVehicleToDriver(u,vehicleId);
        }

        audit.log(a.getName(),"USER_UPDATE",u.getEmail()+" / "+u.getRole());
        return u;
    }


    @DeleteMapping("/users/{id}")
    public User archiveUser(@PathVariable Long id,Authentication a){
        User u=users.findById(id).orElseThrow(()->new IllegalArgumentException("User not found"));
        if(u.getEmail().equalsIgnoreCase(a.getName())) throw new IllegalStateException("You cannot archive your own administrator account while logged in");
        u.setArchived(true);u.setArchivedAt(java.time.LocalDateTime.now());u.setActive(false);u.setAvailable(false);u.setOnLeave(false);
        if(u.getRole()==Role.JEEP_DRIVER) unlinkDriverVehicles(u.getId());
        users.save(u);audit.log(a.getName(),"USER_ARCHIVE",u.getEmail()+" / "+u.getRole());return u;
    }

    @PatchMapping("/users/{id}/restore")
    public User restoreUser(@PathVariable Long id,Authentication a){
        User u=users.findById(id).orElseThrow(()->new IllegalArgumentException("User not found"));
        u.setArchived(false);u.setArchivedAt(null);u.setActive(true);u.setAvailable(true);u.setOnLeave(false);users.save(u);
        audit.log(a.getName(),"USER_RESTORE",u.getEmail()+" / "+u.getRole());return u;
    }

    @DeleteMapping("/users/{id}/permanent")
    public Map<String,Object> permanentlyDeleteUser(@PathVariable Long id,@RequestParam(defaultValue="") String confirm,Authentication a){
        if(!"DELETE".equals(confirm)) throw new IllegalArgumentException("Type DELETE to confirm permanent account deletion");
        User u=users.findById(id).orElseThrow(()->new IllegalArgumentException("User not found"));
        if(u.getEmail().equalsIgnoreCase(a.getName())) throw new IllegalStateException("You cannot permanently delete your own administrator account while logged in");
        if(!u.isArchived()) throw new IllegalStateException("Delete Account must be completed first. Permanent deletion is available only for an archived account.");
        if(u.getRole()==Role.SYSTEM_ADMIN){
            long otherAdmins=users.findByRole(Role.SYSTEM_ADMIN).stream().filter(x->!x.getId().equals(u.getId())&&!x.isArchived()&&x.isActive()).count();
            if(otherAdmins==0) throw new IllegalStateException("The last active System Administrator cannot be permanently deleted");
        }
        String removed=u.getEmail()+" / "+u.getRole();
        Map<String,Object> result=accountDeletion.permanentlyDelete(u);
        audit.log(a.getName(),"USER_PERMANENT_DELETE",removed);
        return result;
    }

    @GetMapping("/audit")
    public List<AuditLog> audit(){return logs.findTop100ByOrderByCreatedAtDesc();}

    @GetMapping("/settings")
    public List<SystemSetting> settings(){return settings.findAll();}

    @PutMapping("/settings/{id}")
    public SystemSetting setting(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication a){
        SystemSetting s=settings.findById(id).orElseThrow();
        s.setSettingValue(body.getOrDefault("settingValue",s.getSettingValue()));
        settings.save(s);
        audit.log(a.getName(),"SYSTEM_SETTING_UPDATE",s.getSettingKey());
        return s;
    }

    private void assignVehicleToDriver(User driver, Long vehicleId) {
        if (driver.getRole()!=Role.JEEP_DRIVER) {
            unlinkDriverVehicles(driver.getId());
            return;
        }

        List<Vehicle> current = vehicles.findByDriverId(driver.getId());
        if (vehicleId==null) {
            current.forEach(v->{v.setDriver(null);vehicles.save(v);});
            return;
        }

        Vehicle target=vehicles.findById(vehicleId).orElseThrow(()->new IllegalArgumentException("Selected vehicle not found"));
        boolean alreadyLinkedToDriver = target.getDriver()!=null && target.getDriver().getId().equals(driver.getId());
        if (target.getDriver()!=null && !alreadyLinkedToDriver)
            throw new IllegalStateException("This vehicle is already assigned to another driver");
        if (!alreadyLinkedToDriver && target.getStatus()!=VehicleStatus.AVAILABLE)
            throw new IllegalStateException("Only an AVAILABLE vehicle can be assigned to a driver");
        if (target.getStatus()==VehicleStatus.MAINTENANCE || target.getStatus()==VehicleStatus.INACTIVE)
            throw new IllegalStateException("A maintenance/inactive vehicle cannot be assigned to a driver");

        for (Vehicle v: current) {
            if (!v.getId().equals(target.getId())) {v.setDriver(null);vehicles.save(v);}
        }
        target.setDriver(driver);
        vehicles.save(target);
    }

    private void unlinkDriverVehicles(Long driverId) {
        for (Vehicle v: vehicles.findByDriverId(driverId)) {
            v.setDriver(null);
            vehicles.save(v);
        }
    }
}
