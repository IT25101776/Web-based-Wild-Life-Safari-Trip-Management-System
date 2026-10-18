package com.safarilanka.controller;

import com.safarilanka.dto.*;
import com.safarilanka.model.*;
import com.safarilanka.repository.UserRepository;
import com.safarilanka.security.*;
import com.safarilanka.service.AuditService;
import com.safarilanka.service.UserProfileRules;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
 private final AuthenticationManager am; private final CustomUserDetailsService uds; private final JwtService jwt; private final UserRepository users; private final PasswordEncoder encoder; private final AuditService audit;
 @Value("${app.frontend.public.dir:../frontend/public}") private String frontendPublicDir;
 public AuthController(AuthenticationManager am,CustomUserDetailsService uds,JwtService jwt,UserRepository users,PasswordEncoder encoder,AuditService audit){this.am=am;this.uds=uds;this.jwt=jwt;this.users=users;this.encoder=encoder;this.audit=audit;}

 @PostMapping("/login") public Map<String,Object> login(@Valid @RequestBody LoginRequest r){
   am.authenticate(new UsernamePasswordAuthenticationToken(r.email(),r.password()));
   UserDetails d=uds.loadUserByUsername(r.email()); User u=users.findByEmailIgnoreCase(r.email()).orElseThrow();
   audit.log(u.getEmail(),"LOGIN","User logged in"); return Map.of("token",jwt.generate(d),"user",view(u));
 }

 @PostMapping("/register") public Map<String,Object> register(@Valid @RequestBody RegisterRequest r){
   if(users.existsByEmailIgnoreCase(r.email()))throw new IllegalArgumentException("Email already registered");
   User u=new User(); u.setFullName(r.fullName());u.setEmail(r.email().toLowerCase());u.setPassword(encoder.encode(r.password()));u.setPhone(r.phone());u.setRole(Role.TOURIST);
   UserProfileRules.apply(u,u.getFullName(),u.getPhone(),null,null,null,null);
   applyTouristProfile(u,r.country(),r.preferredCurrency(),r.gender(),r.birthDate(),r.identityType(),r.identityNumber());
   String registerLanguage=r.preferredLanguage()==null?"ENGLISH":r.preferredLanguage().trim().toUpperCase(Locale.ROOT);
   if(!Set.of("ENGLISH","SINHALA","TAMIL","HINDI","CHINESE").contains(registerLanguage)) throw new IllegalArgumentException("Choose a valid system language");
   u.setPreferredLanguage(registerLanguage);
   users.save(u); audit.log(u.getEmail(),"REGISTER","Tourist account created");
   UserDetails d=uds.loadUserByUsername(u.getEmail()); return Map.of("token",jwt.generate(d),"user",view(u));
 }

 @GetMapping("/me") @PreAuthorize("isAuthenticated()")
 public Map<String,Object> me(Authentication a){return view(users.findByEmailIgnoreCase(a.getName()).orElseThrow());}

 @PutMapping("/account") @PreAuthorize("isAuthenticated()")
 public Map<String,Object> account(@RequestBody AccountUpdateRequest r, Authentication a){
   User u=users.findByEmailIgnoreCase(a.getName()).orElseThrow();
   UserProfileRules.apply(u,
      (u.getRole()==Role.TOURIST||u.getRole()==Role.SYSTEM_ADMIN)?(r.fullName()==null?u.getFullName():r.fullName()):u.getFullName(),
      r.phone()==null?u.getPhone():r.phone(),
      r.address()==null?u.getAddress():r.address(),
      r.qualifications()==null?u.getQualifications():r.qualifications(),
      r.languages()==null?u.getLanguages():r.languages(),
      r.licenseNumber()==null?u.getLicenseNumber():r.licenseNumber());
   if(u.getRole()==Role.TOURIST){
      applyTouristProfile(u,
         r.country()==null?u.getCountry():r.country(),
         r.preferredCurrency()==null?u.getPreferredCurrency():r.preferredCurrency(),
         r.gender()==null?u.getGender():r.gender(),
         r.birthDate()==null?u.getBirthDate():r.birthDate(),
         r.identityType()==null?u.getIdentityType():r.identityType(),
         r.identityNumber()==null?u.getIdentityNumber():r.identityNumber());
   }
   if(r.preferredLanguage()!=null){
      String language=r.preferredLanguage().trim().toUpperCase(Locale.ROOT);
      if(!Set.of("ENGLISH","SINHALA","TAMIL","HINDI","CHINESE").contains(language)) throw new IllegalArgumentException("Choose a valid system language");
      u.setPreferredLanguage(language);
   }
   if(r.newPassword()!=null && !r.newPassword().isBlank()){
      if(r.newPassword().length()<8 || !r.newPassword().matches("^(?=.*[A-Za-z])(?=.*\\d).{8,}$")) throw new IllegalArgumentException("New password must be at least 8 characters and include a letter and a number");
      u.setPassword(encoder.encode(r.newPassword()));
   }
   users.save(u); audit.log(u.getEmail(),"ACCOUNT_UPDATE","User updated own account details"); return view(u);
 }

 @PutMapping("/tourist-email") @PreAuthorize("hasRole('TOURIST')")
 public Map<String,Object> touristEmail(@RequestBody Map<String,String> body,Authentication a){
   User u=users.findByEmailIgnoreCase(a.getName()).orElseThrow();
   String next=Optional.ofNullable(body.get("email")).orElse("").trim().toLowerCase(Locale.ROOT);
   if(!next.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) throw new IllegalArgumentException("Enter a valid email address");
   Optional<User> existing=users.findByEmailIgnoreCase(next);
   if(existing.isPresent()&&!existing.get().getId().equals(u.getId())) throw new IllegalArgumentException("That email address is already registered");
   String old=u.getEmail();u.setEmail(next);users.save(u);
   audit.log(next,"TOURIST_EMAIL_CHANGE",old+" -> "+next);
   UserDetails d=uds.loadUserByUsername(next);
   Map<String,Object> out=new LinkedHashMap<>();out.put("token",jwt.generate(d));out.put("user",view(u));out.put("message","Email updated successfully. Use the new email the next time you sign in.");return out;
 }


 @PutMapping("/admin-email") @PreAuthorize("hasRole('SYSTEM_ADMIN')")
 public Map<String,Object> adminEmail(@RequestBody Map<String,String> body,Authentication a){
   User u=users.findByEmailIgnoreCase(a.getName()).orElseThrow();
   String next=Optional.ofNullable(body.get("email")).orElse("").trim().toLowerCase(Locale.ROOT);
   if(!next.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) throw new IllegalArgumentException("Enter a valid email address");
   Optional<User> existing=users.findByEmailIgnoreCase(next);
   if(existing.isPresent()&&!existing.get().getId().equals(u.getId())) throw new IllegalArgumentException("That email address is already registered");
   String old=u.getEmail();u.setEmail(next);users.save(u);
   audit.log(next,"ADMIN_EMAIL_CHANGE",old+" -> "+next);
   UserDetails d=uds.loadUserByUsername(next);
   Map<String,Object> out=new LinkedHashMap<>();out.put("token",jwt.generate(d));out.put("user",view(u));out.put("message","Administrator email updated successfully. Use the new email the next time you sign in.");return out;
 }

 @PostMapping(value="/profile-image", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
 @PreAuthorize("isAuthenticated()")
 public Map<String,Object> profileImage(@RequestPart("image") MultipartFile image, Authentication a) throws IOException {
   if(image==null||image.isEmpty()) throw new IllegalArgumentException("Please choose a profile image");
   String type=Optional.ofNullable(image.getContentType()).orElse("").toLowerCase(Locale.ROOT);
   String ext=switch(type){case "image/jpeg" -> ".jpg"; case "image/png" -> ".png"; case "image/webp" -> ".webp"; default -> throw new IllegalArgumentException("Profile picture must be JPG, PNG or WEBP");};
   if(image.getSize()>5L*1024*1024) throw new IllegalArgumentException("Profile picture must be 5 MB or smaller");
   Path dir=resolveFrontendPublicDir().resolve("images").resolve("profiles").normalize();Files.createDirectories(dir);
   String filename="profile-"+UUID.randomUUID()+ext;Path target=dir.resolve(filename).normalize();if(!target.startsWith(dir))throw new IllegalStateException("Invalid upload path");image.transferTo(target);
   User u=users.findByEmailIgnoreCase(a.getName()).orElseThrow();u.setProfileImageUrl("/images/profiles/"+filename);users.save(u);audit.log(u.getEmail(),"PROFILE_IMAGE_UPDATE","Profile picture updated");return view(u);
 }

 @DeleteMapping("/profile-image") @PreAuthorize("isAuthenticated()")
 public Map<String,Object> removeProfileImage(Authentication a){User u=users.findByEmailIgnoreCase(a.getName()).orElseThrow();u.setProfileImageUrl(null);users.save(u);audit.log(u.getEmail(),"PROFILE_IMAGE_REMOVE","Profile picture removed");return view(u);}

 private Path resolveFrontendPublicDir(){for(Path p:List.of(Path.of(frontendPublicDir),Path.of("frontend","public"),Path.of("..","frontend","public"))){Path x=p.toAbsolutePath().normalize();if(Files.isDirectory(x))return x;}return Path.of(frontendPublicDir).toAbsolutePath().normalize();}

 private void applyTouristProfile(User u,String country,String currency,String gender,java.time.LocalDate birthDate,String identityType,String identityNumber){
   String c=country==null?"":country.trim();
   String cur=currency==null?"":currency.trim().toUpperCase(Locale.ROOT);
   String g=gender==null?"":gender.trim().toUpperCase(Locale.ROOT);
   String type=identityType==null?"":identityType.trim().toUpperCase(Locale.ROOT);
   String id=identityNumber==null?"":identityNumber.trim().toUpperCase(Locale.ROOT);
   if(c.isBlank()) throw new IllegalArgumentException("Country is required");
   if(!cur.matches("[A-Z]{3}")) throw new IllegalArgumentException("Choose a valid display currency");
   if(!Set.of("MALE","FEMALE","OTHER","PREFER_NOT_TO_SAY").contains(g)) throw new IllegalArgumentException("Choose a valid gender option");
   if(birthDate==null || !birthDate.isBefore(java.time.LocalDate.now())) throw new IllegalArgumentException("Birthday must be in the past");
   boolean sriLankan="Sri Lanka".equalsIgnoreCase(c);
   if(!sriLankan && !"PASSPORT".equals(type)) throw new IllegalArgumentException("International tourists must use a passport");
   if("NIC".equals(type)){
      if(!sriLankan) throw new IllegalArgumentException("NIC is available only for Sri Lankan tourists");
      if(!id.matches("(?:\\d{12}|\\d{9}V)")) throw new IllegalArgumentException("NIC must contain either 12 digits or 9 digits followed by V");
   } else if("PASSPORT".equals(type)){
      if(!id.matches("[A-Z0-9]{6,20}")) throw new IllegalArgumentException("Passport must contain 6 to 20 letters/numbers only");
   } else throw new IllegalArgumentException("Identity type must be NIC or passport");
   u.setCountry(c);u.setPreferredCurrency(cur);u.setGender(g);u.setBirthDate(birthDate);u.setIdentityType(type);u.setIdentityNumber(id);
 }

 private Map<String,Object> view(User u){
   Map<String,Object> m=new LinkedHashMap<>();
   m.put("id",u.getId());m.put("fullName",u.getFullName());m.put("email",u.getEmail());m.put("role",u.getRole());m.put("phone",u.getPhone());m.put("address",u.getAddress());
   m.put("country",u.getCountry());m.put("preferredCurrency",u.getPreferredCurrency());m.put("preferredLanguage",u.getPreferredLanguage());m.put("gender",u.getGender());m.put("birthDate",u.getBirthDate());m.put("identityType",u.getIdentityType());m.put("identityNumber",u.getIdentityNumber());
   m.put("active",u.isActive());m.put("available",u.isAvailable());m.put("onLeave",u.isOnLeave());m.put("archived",u.isArchived());m.put("archivedAt",u.getArchivedAt());m.put("qualifications",u.getQualifications());m.put("languages",u.getLanguages());m.put("licenseNumber",u.getLicenseNumber());m.put("profileImageUrl",u.getProfileImageUrl());m.put("createdAt",u.getCreatedAt());
   return m;
 }
}
