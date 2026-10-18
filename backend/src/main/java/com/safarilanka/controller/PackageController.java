package com.safarilanka.controller;

import com.safarilanka.dto.PackageRequest;
import com.safarilanka.model.SafariPackage;
import com.safarilanka.repository.SafariPackageRepository;
import com.safarilanka.service.AuditService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController @RequestMapping("/api/packages")
public class PackageController {
 private final SafariPackageRepository repo; private final AuditService audit;
 @Value("${app.upload.dir:uploads}") private String uploadDir;
 @Value("${app.frontend.public.dir:../frontend/public}") private String frontendPublicDir;
 public PackageController(SafariPackageRepository r,AuditService a){repo=r;audit=a;}
 @GetMapping public List<SafariPackage> publicList(){return repo.findByPublishedTrueAndDeletedFalseOrderByIdAsc();}
 @GetMapping("/all") @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public List<SafariPackage> all(){return repo.findByDeletedFalseOrderByIdAsc();}
 @GetMapping("/{id}") public SafariPackage one(@PathVariable Long id){SafariPackage p=repo.findById(id).orElseThrow(()->new IllegalArgumentException("Package not found"));if(p.isDeleted())throw new IllegalArgumentException("Package not found");return p;}
 @PostMapping @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public SafariPackage create(@Valid @RequestBody PackageRequest r,Authentication a){if(repo.existsByNameIgnoreCase(r.name()))throw new IllegalArgumentException("Package name already exists"); SafariPackage p=apply(new SafariPackage(),r); repo.save(p); audit.log(a.getName(),"PACKAGE_CREATE",p.getName()); return p;}
 @PutMapping("/{id}") @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public SafariPackage update(@PathVariable Long id,@Valid @RequestBody PackageRequest r,Authentication a){SafariPackage p=repo.findById(id).orElseThrow(()->new IllegalArgumentException("Package not found")); apply(p,r); repo.save(p); audit.log(a.getName(),"PACKAGE_UPDATE",p.getName()); return p;}
 @PatchMapping("/{id}/toggle") @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public SafariPackage toggle(@PathVariable Long id,Authentication a){SafariPackage p=repo.findById(id).orElseThrow();p.setPublished(!p.isPublished());repo.save(p);audit.log(a.getName(),"PACKAGE_PUBLISH_TOGGLE",p.getName()+" -> "+p.isPublished());return p;}
 @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')") public Map<String,String> delete(@PathVariable Long id,Authentication a){SafariPackage p=repo.findById(id).orElseThrow(()->new IllegalArgumentException("Package not found"));if(p.isDeleted())throw new IllegalArgumentException("Package not found");p.setPublished(false);p.setDeleted(true);repo.save(p);audit.log(a.getName(),"PACKAGE_DELETE",p.getName());return Map.of("message","Package deleted");}

 @PostMapping(value="/upload-image", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
 @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
 public Map<String,String> uploadImage(@RequestPart("image") MultipartFile image) throws IOException {
   if(image==null||image.isEmpty()) throw new IllegalArgumentException("Please choose an image");
   String type=Optional.ofNullable(image.getContentType()).orElse("").toLowerCase(Locale.ROOT);
   String ext=switch(type){case "image/jpeg" -> ".jpg"; case "image/png" -> ".png"; case "image/webp" -> ".webp"; default -> throw new IllegalArgumentException("Only JPG, PNG and WEBP images are supported");};
   if(image.getSize()>8L*1024*1024) throw new IllegalArgumentException("Package image must be 8 MB or smaller");
   Path dir=Path.of(uploadDir,"package-images").toAbsolutePath().normalize();Files.createDirectories(dir);
   String filename="package-"+UUID.randomUUID()+ext;Path target=dir.resolve(filename).normalize();if(!target.startsWith(dir))throw new IllegalStateException("Invalid upload path");image.transferTo(target);
   // Return a relative URL so the same image works locally, on LAN and through ngrok.
   return Map.of("url","/uploads/package-images/"+filename);
 }

 @PostMapping(value="/upload-video", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
 @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
 public Map<String,String> uploadVideo(@RequestPart("video") MultipartFile video,
                                       @RequestPart(value="packageName", required=false) String packageName) throws IOException {
   if(video==null||video.isEmpty()) throw new IllegalArgumentException("Please choose a video");
   String type=Optional.ofNullable(video.getContentType()).orElse("").toLowerCase(Locale.ROOT);
   String ext=switch(type){case "video/mp4" -> ".mp4"; case "video/webm" -> ".webm"; default -> throw new IllegalArgumentException("Only MP4 and WEBM videos are supported");};
   if(video.getSize()>50L*1024*1024) throw new IllegalArgumentException("Package video must be 50 MB or smaller");
   Path dir=resolveFrontendPublicDir().resolve("videos").resolve("packages").normalize();
   Files.createDirectories(dir);
   String base=slug(packageName==null||packageName.isBlank()?"package":packageName);
   String filename=base+"-"+System.currentTimeMillis()+ext;
   Path target=dir.resolve(filename).normalize();
   if(!target.startsWith(dir)) throw new IllegalStateException("Invalid upload path");
   video.transferTo(target);
   return Map.of("url","/videos/packages/"+filename);
 }

 private Path resolveFrontendPublicDir(){
   List<Path> candidates=List.of(Path.of(frontendPublicDir),Path.of("frontend","public"),Path.of("..","frontend","public"));
   for(Path candidate:candidates){
     Path absolute=candidate.toAbsolutePath().normalize();
     if(Files.isDirectory(absolute)) return absolute;
   }
   return Path.of(frontendPublicDir).toAbsolutePath().normalize();
 }

 private String slug(String value){
   String s=value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+","-").replaceAll("^-+|-+$","");
   return s.isBlank()?"package":s;
 }

 private SafariPackage apply(SafariPackage p,PackageRequest r){p.setName(r.name());p.setDescription(r.description());p.setRouteZone(r.routeZone());p.setTimeSlot(r.timeSlot());p.setPricePerPerson(r.pricePerPerson());p.setAdditionalVehicleFee(r.additionalVehicleFee()==null?r.pricePerPerson():r.additionalVehicleFee());p.setMaxVisitors(r.maxVisitors());p.setMaxVehicles(r.maxVehicles());p.setPublished(r.published());p.setImageUrl(r.imageUrl());p.setVideoUrl(r.videoUrl());p.setDuration(r.duration());return p;}
}
