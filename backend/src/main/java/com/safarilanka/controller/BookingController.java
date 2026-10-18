package com.safarilanka.controller;

import com.safarilanka.dto.*;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.*;
import com.safarilanka.service.identity.IdentityValidatorFactory;
import com.safarilanka.service.pricing.PricingContext;
import com.safarilanka.service.pricing.PricingResult;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingRepository bookings;
    private final SafariPackageRepository packages;
    private final VisitorRepository visitors;
    private final PermitRepository permits;
    private final TripAssignmentRepository assignments;
    private final PaymentRepository payments;
    private final CurrentUserService current;
    private final AuditService audit;
    private final IdentityValidatorFactory identityValidatorFactory;
    private final PricingContext pricingContext;
    private final NotificationService notifications;

    public BookingController(BookingRepository b, SafariPackageRepository p, VisitorRepository v,
                             PermitRepository pe, TripAssignmentRepository ta, PaymentRepository pay,
                             CurrentUserService c, AuditService a,
                             IdentityValidatorFactory identityValidatorFactory, PricingContext pricingContext,
                             NotificationService notifications) {
        bookings = b; packages = p; visitors = v; permits = pe; assignments = ta; payments = pay; current = c; audit = a;
        this.identityValidatorFactory = identityValidatorFactory; // retained for legacy visitor records / earlier design-pattern implementation
        this.pricingContext = pricingContext; this.notifications=notifications;
    }

    @PostMapping
    @PreAuthorize("hasRole('TOURIST')")
    public Booking create(@Valid @RequestBody BookingRequest r, Authentication a) {
        User u = current.get(a);
        SafariPackage p = packages.findById(r.packageId()).orElseThrow(() -> new IllegalArgumentException("Safari package not found"));
        if (!p.isPublished()) throw new IllegalStateException("Package is not currently published");
        validateDate(r.visitDate());

        VisitorCounts counts=visitorCounts(r);
        int total=counts.total();
        int requiredVehicles = (total + 5) / 6;
        validateCapacity(p,r.visitDate(),null,total,requiredVehicles);

        int chargeableVisitors = counts.adults() + counts.childFiveToEleven(); // Children below 5 are free per-person but still use vehicle capacity.
        BigDecimal extraFee = p.getAdditionalVehicleFee() == null ? p.getPricePerPerson() : p.getAdditionalVehicleFee();
        PricingResult pricing = pricingContext.calculate(p.getPricePerPerson(), chargeableVisitors, requiredVehicles, extraFee);

        Booking b = new Booking();
        b.setBookingCode("SL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        b.setTourist(u);b.setSafariPackage(p);b.setVisitDate(r.visitDate());
        applyCounts(b,counts);b.setVehicleCount(requiredVehicles);b.setVehicleSurcharge(pricing.vehicleSurcharge());
        b.setGroupLeaderName(r.groupLeaderName());b.setContactPhone(r.contactPhone());b.setEmergencyContact(r.emergencyContact());b.setSpecialRequirements(r.specialRequirements());
        b.setBookingStatus(BookingStatus.PENDING);b.setPaymentStatus(PaymentStatus.UNPAID);b.setCancellationReason(null);b.setTotalAmount(pricing.totalAmount());
        bookings.save(b);

        // New bookings deliberately do not create individual Visitor rows. Existing historical visitor rows remain untouched.
        Permit permit = new Permit();permit.setBooking(b);permit.setPermitCode("YALA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());permits.save(permit);
        notifications.sendToOperators(u,"New safari booking",b.getBookingCode()+" • "+p.getName()+" • "+b.getVisitDate()+" • "+total+" visitors. Review and confirm the booking.","NEW_BOOKING");
        notifications.sendToAdmins(u,"New safari booking",b.getBookingCode()+" was created by "+u.getFullName()+" for "+b.getVisitDate()+".","NEW_BOOKING");
        audit.log(a.getName(), "BOOKING_CREATE", b.getBookingCode() + " / awaiting operator confirmation / visitors="+total+" / vehicles=" + requiredVehicles);
        return b;
    }

    @GetMapping("/mine") @PreAuthorize("hasRole('TOURIST')")
    public List<Map<String, Object>> mine(Authentication a) {return bookings.findByTouristEmailOrderByCreatedAtDesc(a.getName()).stream().map(this::detail).toList();}

    @GetMapping("/all") @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','FINANCE_MANAGER','PARK_OFFICER','SYSTEM_ADMIN')")
    public List<Map<String, Object>> all() {return bookings.findAll().stream().sorted(Comparator.comparing(Booking::getCreatedAt).reversed()).map(this::detail).toList();}

    @GetMapping("/{id}")
    public Map<String, Object> one(@PathVariable Long id, Authentication a) {
        Booking b = bookings.findById(id).orElseThrow(() -> new IllegalArgumentException("Booking not found"));User u = current.get(a);
        if (u.getRole() == Role.TOURIST && !b.getTourist().getId().equals(u.getId())) throw new IllegalArgumentException("You cannot access this booking");
        return detail(b);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TOURIST')")
    @Transactional
    public Map<String,Object> updatePending(@PathVariable Long id,@Valid @RequestBody BookingRequest r,Authentication a){
        Booking b=bookings.findById(id).orElseThrow(()->new IllegalArgumentException("Booking not found"));
        if(!b.getTourist().getEmail().equalsIgnoreCase(a.getName())) throw new IllegalArgumentException("Not your booking");
        if(b.getBookingStatus()!=BookingStatus.PENDING || b.getPaymentStatus()!=PaymentStatus.UNPAID) throw new IllegalStateException("Only pending, unpaid bookings can be edited");
        if(!payments.findByBookingIdOrderByCreatedAtDesc(id).isEmpty()) throw new IllegalStateException("A booking with payment history cannot be edited");
        validateDate(r.visitDate());

        SafariPackage p=packages.findById(r.packageId()).orElseThrow(()->new IllegalArgumentException("Safari package not found"));
        if(!p.isPublished()) throw new IllegalStateException("Package is not currently published");
        VisitorCounts counts=visitorCounts(r);int total=counts.total();int requiredVehicles=(total+5)/6;
        validateCapacity(p,r.visitDate(),id,total,requiredVehicles);
        int chargeableVisitors=counts.adults()+counts.childFiveToEleven(); // Children below 5 are free per-person but still use vehicle capacity.
        BigDecimal extraFee=p.getAdditionalVehicleFee()==null?p.getPricePerPerson():p.getAdditionalVehicleFee();
        PricingResult pricing=pricingContext.calculate(p.getPricePerPerson(),chargeableVisitors,requiredVehicles,extraFee);
        b.setSafariPackage(p);b.setVisitDate(r.visitDate());applyCounts(b,counts);b.setVehicleCount(requiredVehicles);b.setVehicleSurcharge(pricing.vehicleSurcharge());b.setTotalAmount(pricing.totalAmount());
        b.setGroupLeaderName(r.groupLeaderName());b.setContactPhone(r.contactPhone());b.setEmergencyContact(r.emergencyContact());b.setSpecialRequirements(r.specialRequirements());bookings.save(b);
        audit.log(a.getName(),"BOOKING_UPDATE",b.getBookingCode()+" / pending booking details edited");return detail(b);
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('TOURIST')")
    public Booking withdraw(@PathVariable Long id,Authentication a){
        Booking b=bookings.findById(id).orElseThrow(()->new IllegalArgumentException("Booking not found"));
        if(!b.getTourist().getEmail().equalsIgnoreCase(a.getName())) throw new IllegalArgumentException("Not your booking");
        if(b.getBookingStatus()!=BookingStatus.PENDING || b.getPaymentStatus()!=PaymentStatus.UNPAID) throw new IllegalStateException("Only pending, unpaid bookings can be withdrawn");
        if(!payments.findByBookingIdOrderByCreatedAtDesc(id).isEmpty()) throw new IllegalStateException("A booking with payment history cannot be withdrawn with Delete");
        b.setBookingStatus(BookingStatus.CANCELLED);b.setCancellationReason("Withdrawn by tourist before Safari Operator confirmation and payment.");bookings.save(b);
        permits.findByBookingId(id).ifPresent(p->{p.setStatus(PermitStatus.VOID);p.setDecisionReason("Booking withdrawn by tourist before confirmation/payment.");permits.save(p);});
        notifications.sendToOperators(b.getTourist(),"Booking withdrawn",b.getBookingCode()+" was withdrawn by the tourist.","BOOKING_UPDATE");audit.log(a.getName(),"BOOKING_WITHDRAW",b.getBookingCode());return b;
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
    public Booking status(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication a) {
        Booking b = bookings.findById(id).orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        BookingStatus s = BookingStatus.valueOf(body.getOrDefault("status", "PENDING").toUpperCase(Locale.ROOT));
        if (s == BookingStatus.COMPLETED) throw new IllegalStateException("Trips are completed by the assigned driver only after Park Officer checkout.");

        if (s == BookingStatus.CANCELLED) {
            String reason = cleanReason(body.get("reason"));if (reason == null) throw new IllegalArgumentException("Enter a booking cancellation reason");b.setCancellationReason(reason);
        } else if (s == BookingStatus.CONFIRMED) b.setCancellationReason(null);
        b.setBookingStatus(s);bookings.save(b);
        User sender=current.get(a);
        String title=s==BookingStatus.CONFIRMED?"Booking confirmed":s==BookingStatus.CANCELLED?"Booking cancelled":"Booking status updated";
        String message=b.getBookingCode()+" is now "+s+(b.getCancellationReason()==null?"":". Reason: "+b.getCancellationReason());
        notifications.send(b.getTourist(),sender,title,message,"BOOKING_UPDATE");
        audit.log(a.getName(), "BOOKING_STATUS", b.getBookingCode() + " -> " + s + (b.getCancellationReason() == null ? "" : " / " + b.getCancellationReason()));return b;
    }

    @PostMapping("/{id}/cancel") @PreAuthorize("hasRole('TOURIST')")
    public Booking cancel(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication a) {
        Booking b = bookings.findById(id).orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!b.getTourist().getEmail().equalsIgnoreCase(a.getName())) throw new IllegalArgumentException("Not your booking");
        if (b.getBookingStatus() == BookingStatus.COMPLETED) throw new IllegalStateException("Completed booking cannot be cancelled");
        b.setCancellationReason(Optional.ofNullable(body).map(x -> cleanReason(x.get("reason"))).orElse("Cancelled by tourist."));b.setBookingStatus(BookingStatus.CANCELLED);bookings.save(b);
        notifications.sendToOperators(b.getTourist(),"Booking cancelled",b.getBookingCode()+" was cancelled by the tourist. Reason: "+b.getCancellationReason(),"BOOKING_UPDATE");audit.log(a.getName(), "BOOKING_CANCEL", b.getBookingCode() + " / " + b.getCancellationReason());return b;
    }

    private void validateDate(java.time.LocalDate date){if(date==null||!date.isAfter(java.time.LocalDate.now()))throw new IllegalArgumentException("Same-day bookings are not allowed. Choose a date from tomorrow onward.");}
    private VisitorCounts visitorCounts(BookingRequest r){
        int adults=r.resolvedAdults(), c511=r.resolvedChildFiveToEleven(), c5=r.resolvedChildBelowFive();
        if(adults<1)throw new IllegalArgumentException("At least 1 adult is required");if(c511<0||c5<0)throw new IllegalArgumentException("Child visitor counts cannot be negative");
        int total=adults+c511+c5;if(total<1)throw new IllegalArgumentException("At least one visitor is required");return new VisitorCounts(adults,c511,c5,total);
    }
    private void applyCounts(Booking b,VisitorCounts c){b.setAdultCount(c.adults());b.setChildFiveToElevenCount(c.childFiveToEleven());b.setChildBelowFiveCount(c.childBelowFive());b.setVisitorCount(c.total());}
    private void validateCapacity(SafariPackage p,java.time.LocalDate date,Long ignoreId,int total,int requiredVehicles){
        if(requiredVehicles>p.getMaxVehicles())throw new IllegalStateException("This package supports a maximum of "+p.getMaxVehicles()+" vehicles (6 visitors per vehicle)");
        if(total>p.getMaxVehicles()*6)throw new IllegalStateException("A maximum of 6 visitors is allowed per vehicle");
        int used=bookings.findBySafariPackageIdAndVisitDate(p.getId(),date).stream().filter(x->(ignoreId==null||!x.getId().equals(ignoreId))&&x.getBookingStatus()!=BookingStatus.CANCELLED).mapToInt(Booking::getVisitorCount).sum();
        if(used+total>p.getMaxVisitors())throw new IllegalStateException("Selected date does not have enough remaining capacity");
    }
    private String cleanReason(String value) {if (value == null) return null;String v = value.trim();if (v.isEmpty()) return null;if (v.length() > 1000) throw new IllegalArgumentException("Reason must be 1000 characters or less");return v;}

    private Map<String, Object> detail(Booking b) {
        Map<String, Object> m = new LinkedHashMap<>();List<TripAssignment> list = assignments.findByBookingIdOrderByIdAsc(b.getId());List<Payment> paymentRows = payments.findByBookingIdOrderByCreatedAtDesc(b.getId());
        m.put("booking", b);m.put("visitors", visitors.findByBookingId(b.getId())); // historical-only compatibility; new bookings have no individual visitor rows
        m.put("permit", permits.findByBookingId(b.getId()).orElse(null));m.put("assignments", list);m.put("assignment", list.isEmpty() ? null : list.get(0));m.put("assignedVehicleCount", list.size());m.put("payments", paymentRows);m.put("latestPayment", paymentRows.isEmpty() ? null : paymentRows.get(0));return m;
    }
    private record VisitorCounts(int adults,int childFiveToEleven,int childBelowFive,int total){}
}
