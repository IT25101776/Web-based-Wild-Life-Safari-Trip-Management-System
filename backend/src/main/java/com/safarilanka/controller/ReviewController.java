package com.safarilanka.controller;

import com.safarilanka.dto.ReviewRequest;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewRepository reviews;
    private final BookingRepository bookings;
    private final TripAssignmentRepository assignments;
    private final CurrentUserService current;
    private final AuditService audit;

    @Value("${app.frontend.public.dir:../frontend/public}")
    private String frontendPublicDir;

    public ReviewController(ReviewRepository reviews, BookingRepository bookings,
                            TripAssignmentRepository assignments, CurrentUserService current, AuditService audit) {
        this.reviews = reviews;
        this.bookings = bookings;
        this.assignments = assignments;
        this.current = current;
        this.audit = audit;
    }

    @GetMapping("/public")
    public List<Map<String,Object>> publicReviews(){
        return reviews.findByPublishedTrueOrderByCreatedAtDesc().stream().map(this::view).toList();
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('TOURIST')")
    public List<Map<String,Object>> mine(Authentication a){
        return reviews.findByTouristEmailOrderByCreatedAtDesc(a.getName()).stream().map(this::view).toList();
    }

    @PostMapping("/booking/{bookingId}")
    @PreAuthorize("hasRole('TOURIST')")
    public Map<String,Object> create(@PathVariable Long bookingId, @RequestBody ReviewRequest r, Authentication a){
        User u=current.get(a);
        Booking b=bookings.findById(bookingId).orElseThrow(()->new IllegalArgumentException("Booking not found"));
        if(!b.getTourist().getId().equals(u.getId())) throw new IllegalArgumentException("You can only review your own booking");
        if(b.getBookingStatus()!=BookingStatus.COMPLETED) throw new IllegalStateException("A review can be submitted only after the safari trip is completed");
        if(reviews.existsByBookingId(bookingId)) throw new IllegalStateException("A review has already been submitted for this safari");
        validateRating(r.overallRating(), true, "Overall rating");
        validateRating(r.driverRating(), false, "Driver rating");
        validateRating(r.guideRating(), false, "Guide rating");
        if(r.reviewText()==null || r.reviewText().trim().length()<10) throw new IllegalArgumentException("Please write at least 10 characters about your safari experience");
        Review x=new Review();
        x.setBooking(b);x.setTourist(u);x.setSafariPackage(b.getSafariPackage());x.setOverallRating(r.overallRating());
        x.setDriverRating(r.driverRating());x.setGuideRating(r.guideRating());x.setTitle(trim(r.title(),180));
        x.setReviewText(trim(r.reviewText(),4000));x.setDriverReview(trim(r.driverReview(),2000));x.setGuideReview(trim(r.guideReview(),2000));
        if(r.mediaUrls()!=null) x.setMediaUrls(String.join("\n",r.mediaUrls().stream().filter(Objects::nonNull).map(String::trim).filter(s->!s.isBlank()).limit(8).toList()));
        reviews.save(x);
        audit.log(a.getName(),"REVIEW_CREATE",b.getBookingCode()+" / rating="+x.getOverallRating());
        return view(x);
    }

    @PostMapping(value="/upload-media", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TOURIST')")
    public Map<String,String> upload(@RequestPart("media") MultipartFile media) throws IOException {
        if(media==null||media.isEmpty()) throw new IllegalArgumentException("Choose an image or video");
        String type=Optional.ofNullable(media.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        boolean video=type.startsWith("video/");
        String ext=switch(type){
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "video/mp4" -> ".mp4";
            case "video/webm" -> ".webm";
            default -> throw new IllegalArgumentException("Review media must be JPG, PNG, WEBP, MP4 or WEBM");
        };
        long max=video?50L*1024*1024:8L*1024*1024;
        if(media.getSize()>max) throw new IllegalArgumentException(video?"Review video must be 50 MB or smaller":"Review image must be 8 MB or smaller");
        Path dir=resolveFrontendPublicDir().resolve("reviews").resolve("media").normalize();
        Files.createDirectories(dir);
        String filename="review-"+UUID.randomUUID()+ext;
        Path target=dir.resolve(filename).normalize();
        if(!target.startsWith(dir)) throw new IllegalStateException("Invalid upload path");
        media.transferTo(target);
        return Map.of("url","/reviews/media/"+filename,"type",video?"video":"image");
    }

    private void validateRating(Integer value, boolean required, String name){
        if(value==null){if(required)throw new IllegalArgumentException(name+" is required");return;}
        if(value<1||value>5)throw new IllegalArgumentException(name+" must be between 1 and 5");
    }
    private String trim(String value,int max){if(value==null)return null;String s=value.trim();return s.length()>max?s.substring(0,max):s;}
    private Path resolveFrontendPublicDir(){
        for(Path p:List.of(Path.of(frontendPublicDir),Path.of("frontend","public"),Path.of("..","frontend","public"))){Path a=p.toAbsolutePath().normalize();if(Files.isDirectory(a))return a;}
        return Path.of(frontendPublicDir).toAbsolutePath().normalize();
    }
    private Map<String,Object> view(Review r){
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("id",r.getId());m.put("bookingId",r.getBooking().getId());m.put("bookingCode",r.getBooking().getBookingCode());
        m.put("touristName",r.getTourist().getFullName());m.put("touristProfileImageUrl",r.getTourist().getProfileImageUrl());
        m.put("packageId",r.getSafariPackage().getId());m.put("packageName",r.getSafariPackage().getName());m.put("packageImageUrl",r.getSafariPackage().getImageUrl());
        m.put("overallRating",r.getOverallRating());m.put("driverRating",r.getDriverRating());m.put("guideRating",r.getGuideRating());
        m.put("title",r.getTitle());m.put("reviewText",r.getReviewText());m.put("driverReview",r.getDriverReview());m.put("guideReview",r.getGuideReview());
        m.put("mediaUrls",r.getMediaUrls()==null||r.getMediaUrls().isBlank()?List.of():Arrays.stream(r.getMediaUrls().split("\\n")).filter(s->!s.isBlank()).toList());
        List<TripAssignment> as=assignments.findByBookingIdOrderByIdAsc(r.getBooking().getId());
        m.put("driverNames",as.stream().map(x->x.getDriver().getFullName()).distinct().toList());
        m.put("guideNames",as.stream().map(x->x.getGuide().getFullName()).distinct().toList());
        m.put("createdAt",r.getCreatedAt());m.put("published",r.isPublished());
        return m;
    }
}
