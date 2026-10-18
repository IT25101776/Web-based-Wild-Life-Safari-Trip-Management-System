package com.safarilanka.controller;

import com.safarilanka.dto.AvailabilityRequest;
import com.safarilanka.model.*;
import com.safarilanka.repository.UserRepository;
import com.safarilanka.service.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
public class StaffController {
 private final UserRepository users; private final CurrentUserService current; private final AuditService audit;
 public StaffController(UserRepository u,CurrentUserService c,AuditService a){users=u;current=c;audit=a;}
 @GetMapping("/guides") @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public List<User> guides(){return users.findByRole(Role.SAFARI_GUIDE);}
 @GetMapping("/drivers") @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public List<User> drivers(){return users.findByRole(Role.JEEP_DRIVER);}
 @PatchMapping("/me") @PreAuthorize("hasAnyRole('SAFARI_GUIDE','JEEP_DRIVER')")
 public User update(@RequestBody AvailabilityRequest r,Authentication a){
   User u=current.get(a);
   if(r.available()!=null)u.setAvailable(r.available());
   if(r.onLeave()!=null && r.onLeave()!=u.isOnLeave())
       throw new IllegalStateException("Leave status is managed through the Leave Request workflow and System Administrator approval.");
   if(r.qualifications()!=null)u.setQualifications(r.qualifications());
   if(r.languages()!=null)u.setLanguages(r.languages());
   if(r.licenseNumber()!=null && u.getRole()==Role.JEEP_DRIVER)u.setLicenseNumber(DrivingLicenseValidator.requireValid(r.licenseNumber()));
   users.save(u);audit.log(a.getName(),"STAFF_PROFILE_UPDATE","Availability/profile updated");return u;
 }
}
