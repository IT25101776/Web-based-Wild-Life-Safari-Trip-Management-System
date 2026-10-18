package com.safarilanka.controller;

import com.safarilanka.dto.*;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.AuditService;
import com.safarilanka.service.NotificationService;
import com.safarilanka.service.payment.PaymentContext;
import com.safarilanka.service.payment.PaymentStrategyCommand;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentRepository payments;
    private final BookingRepository bookings;
    private final RefundRequestRepository refunds;
    private final AuditService audit;
    private final PaymentContext paymentContext;
    private final NotificationService notifications;

    public PaymentController(PaymentRepository p, BookingRepository b, RefundRequestRepository r, AuditService a, PaymentContext paymentContext, NotificationService notifications) {
        payments = p; bookings = b; refunds = r; audit = a; this.paymentContext = paymentContext; this.notifications = notifications;
    }

    @PostMapping("/booking/{bookingId}/card")
    @PreAuthorize("hasRole('TOURIST')")
    public Payment payCard(@PathVariable Long bookingId, @Valid @RequestBody PaymentRequest r, Authentication a) throws IOException {
        Booking b = ownedPayableBooking(bookingId, a);
        Payment result = paymentContext.process(PaymentMethod.CARD, PaymentStrategyCommand.card(b, r, a.getName()));
        User tourist = b.getTourist();
        notifications.send(tourist, null, "Card payment successful", "Payment for " + b.getBookingCode() + " was completed successfully. Safari Operations can now continue the trip preparation.", "PAYMENT");
        notifications.sendToOperators(tourist, "Booking paid", b.getBookingCode() + " was paid by card and is ready for safari team assignment.", "PAYMENT");
        return result;
    }

    @PostMapping(value="/booking/{bookingId}/bank", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TOURIST')")
    public Payment submitBankDeposit(@PathVariable Long bookingId,
                                     @RequestParam("bankReference") String bankReference,
                                     @RequestPart("slip") MultipartFile slip,
                                     Authentication a) throws IOException {
        Booking b = ownedPayableBooking(bookingId, a);
        Payment result = paymentContext.process(PaymentMethod.BANK_TRANSFER,
                PaymentStrategyCommand.bank(b, bankReference, slip, a.getName()));
        User tourist = b.getTourist();
        notifications.send(tourist, null, "Bank payment submitted", "Your bank transfer for " + b.getBookingCode() + " is waiting for Finance Manager verification.", "PAYMENT");
        notifications.sendToFinance(tourist, "Bank payment waiting for review", b.getBookingCode() + " has a new bank transfer slip. Please approve or reject it.", "PAYMENT_REVIEW");
        return result;
    }

    @GetMapping("/{id}/slip")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<Resource> slip(@PathVariable Long id) throws IOException {
        Payment p = payments.findById(id).orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (p.getMethod() != PaymentMethod.BANK_TRANSFER || p.getBankSlipPath() == null)
            throw new IllegalArgumentException("No bank slip is attached to this payment");
        Path path = Path.of(p.getBankSlipPath()).toAbsolutePath().normalize();
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) throw new IllegalArgumentException("Bank slip file is unavailable");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename(p.getBankSlipFileName()) + "\"")
                .body(resource);
    }

    @PatchMapping("/{id}/bank-review")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','SYSTEM_ADMIN')")
    public Payment reviewBank(@PathVariable Long id, @RequestBody Map<String,String> body, Authentication a) {
        Payment p = payments.findById(id).orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (p.getMethod() != PaymentMethod.BANK_TRANSFER) throw new IllegalArgumentException("Only bank deposits require Finance approval");
        if (p.getStatus() != PaymentStatus.PENDING) throw new IllegalStateException("This bank payment has already been reviewed");
        String decision = body.getOrDefault("status", "").toUpperCase(Locale.ROOT);
        if (!decision.equals("APPROVED") && !decision.equals("REJECTED"))
            throw new IllegalArgumentException("Decision must be APPROVED or REJECTED");

        p.setReviewedBy(a.getName());
        p.setReviewedAt(LocalDateTime.now());
        Booking b = p.getBooking();

        if (decision.equals("APPROVED")) {
            String note = cleanReason(body.get("note"));
            p.setReviewNote(note == null ? "Bank deposit verified and approved by Finance." : note);
            p.setRejectionReason(null);
            p.setStatus(PaymentStatus.PAID);
            p.setPaidAt(LocalDateTime.now());
            b.setPaymentStatus(PaymentStatus.PAID);
            audit.log(a.getName(), "BANK_PAYMENT_APPROVED", p.getPaymentCode() + " / " + b.getBookingCode());
        } else {
            String reason = cleanReason(body.get("reason"));
            if (reason == null) reason = cleanReason(body.get("note"));
            if (reason == null) throw new IllegalArgumentException("Enter a payment rejection reason");
            p.setReviewNote("Rejected by Finance");
            p.setRejectionReason(reason);
            p.setStatus(PaymentStatus.REJECTED);
            b.setPaymentStatus(PaymentStatus.REJECTED);
            audit.log(a.getName(), "BANK_PAYMENT_REJECTED", p.getPaymentCode() + " / " + b.getBookingCode() + " / " + reason);
        }

        payments.save(p);
        bookings.save(b);
        User reviewer = notifications.userByEmail(a.getName());
        if (decision.equals("APPROVED")) {
            notifications.send(b.getTourist(), reviewer, "Bank payment approved", "Finance approved the bank payment for " + b.getBookingCode() + ". Safari Operations can now assign the safari team.", "PAYMENT_APPROVED");
            notifications.sendToOperators(reviewer, "Payment approved", b.getBookingCode() + " bank payment is approved and ready for assignment.", "PAYMENT_APPROVED");
        } else {
            notifications.send(b.getTourist(), reviewer, "Bank payment rejected", "The bank payment for " + b.getBookingCode() + " was rejected. Reason: " + p.getRejectionReason(), "PAYMENT_REJECTED");
            notifications.sendToOperators(reviewer, "Payment rejected", b.getBookingCode() + " bank payment was rejected. Reason: " + p.getRejectionReason(), "PAYMENT_REJECTED");
        }
        return p;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('TOURIST')")
    public List<Payment> mine(Authentication a){return payments.findByBookingTouristEmailOrderByCreatedAtDesc(a.getName());}

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','SYSTEM_ADMIN')")
    public List<Payment> all(){return payments.findAll().stream().sorted(Comparator.comparing(Payment::getCreatedAt).reversed()).toList();}

    @PostMapping("/booking/{bookingId}/refund")
    @PreAuthorize("hasRole('TOURIST')")
    public RefundRequest requestRefund(@PathVariable Long bookingId,@Valid @RequestBody RefundCreateRequest r,Authentication a){
        Booking b=bookings.findById(bookingId).orElseThrow();
        if(!b.getTourist().getEmail().equalsIgnoreCase(a.getName()))throw new IllegalArgumentException("Not your booking");
        Payment p=payments.findFirstByBookingIdAndStatusOrderByCreatedAtDesc(bookingId,PaymentStatus.PAID).orElseThrow(()->new IllegalStateException("No successful payment found"));
        if(refunds.existsByBookingIdAndStatus(bookingId,RefundStatus.PENDING))throw new IllegalStateException("A refund request is already pending");
        RefundRequest rr=new RefundRequest();rr.setBooking(b);rr.setPayment(p);rr.setAmount(p.getAmount());rr.setReason(r.reason());refunds.save(rr);audit.log(a.getName(),"REFUND_REQUEST",b.getBookingCode());notifications.sendToFinance(b.getTourist(),"New refund request",b.getBookingCode()+" has a refund request: "+r.reason(),"REFUND");notifications.sendToAdmins(b.getTourist(),"New refund request",b.getBookingCode()+" has a refund request waiting for Finance review.","REFUND");return rr;
    }

    @GetMapping("/refunds/mine") @PreAuthorize("hasRole('TOURIST')")
    public List<RefundRequest> myRefunds(Authentication a){return refunds.findByBookingTouristEmailOrderByCreatedAtDesc(a.getName());}


    @PutMapping("/refunds/{id}")
    @PreAuthorize("hasRole('TOURIST')")
    public RefundRequest updateRefund(@PathVariable Long id,@Valid @RequestBody RefundCreateRequest r,Authentication a){
        RefundRequest rr=refunds.findById(id).orElseThrow(()->new IllegalArgumentException("Refund request not found"));
        if(!rr.getBooking().getTourist().getEmail().equalsIgnoreCase(a.getName())) throw new IllegalArgumentException("Not your refund request");
        if(rr.getStatus()!=RefundStatus.PENDING) throw new IllegalStateException("Only pending refund requests can be edited");
        rr.setReason(r.reason().trim());refunds.save(rr);
        audit.log(a.getName(),"REFUND_UPDATE",rr.getBooking().getBookingCode()+" / refund="+id);
        notifications.sendToFinance(rr.getBooking().getTourist(),"Refund request updated",rr.getBooking().getBookingCode()+" refund reason was updated.","REFUND");
        return rr;
    }

    @DeleteMapping("/refunds/{id}")
    @PreAuthorize("hasRole('TOURIST')")
    public RefundRequest withdrawRefund(@PathVariable Long id,Authentication a){
        RefundRequest rr=refunds.findById(id).orElseThrow(()->new IllegalArgumentException("Refund request not found"));
        if(!rr.getBooking().getTourist().getEmail().equalsIgnoreCase(a.getName())) throw new IllegalArgumentException("Not your refund request");
        if(rr.getStatus()!=RefundStatus.PENDING) throw new IllegalStateException("Only pending refund requests can be withdrawn");
        rr.setStatus(RefundStatus.WITHDRAWN);rr.setDecisionNote("Withdrawn by tourist");rr.setDecidedAt(LocalDateTime.now());refunds.save(rr);
        audit.log(a.getName(),"REFUND_WITHDRAW",rr.getBooking().getBookingCode()+" / refund="+id);
        notifications.sendToFinance(rr.getBooking().getTourist(),"Refund request withdrawn",rr.getBooking().getBookingCode()+" refund request was withdrawn by the tourist.","REFUND");
        return rr;
    }

    @GetMapping("/refunds") @PreAuthorize("hasAnyRole('FINANCE_MANAGER','SYSTEM_ADMIN')")
    public List<RefundRequest> allRefunds(){return refunds.findAll();}

    @PatchMapping("/refunds/{id}") @PreAuthorize("hasAnyRole('FINANCE_MANAGER','SYSTEM_ADMIN')")
    public RefundRequest decide(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication a){
        RefundRequest rr=refunds.findById(id).orElseThrow();
        RefundStatus s=RefundStatus.valueOf(body.getOrDefault("status","REJECTED"));
        if(s!=RefundStatus.APPROVED&&s!=RefundStatus.REJECTED&&s!=RefundStatus.PROCESSED)throw new IllegalArgumentException("Invalid refund decision");
        rr.setStatus(s);rr.setDecisionNote(body.get("note"));rr.setDecidedAt(LocalDateTime.now());refunds.save(rr);
        if(s==RefundStatus.APPROVED||s==RefundStatus.PROCESSED){
            Payment p=rr.getPayment();p.setStatus(PaymentStatus.REFUNDED);payments.save(p);
            Booking b=rr.getBooking();b.setPaymentStatus(PaymentStatus.REFUNDED);b.setBookingStatus(BookingStatus.CANCELLED);if(b.getCancellationReason()==null||b.getCancellationReason().isBlank())b.setCancellationReason("Booking cancelled after approved refund request.");bookings.save(b);
        }
        audit.log(a.getName(),"REFUND_DECISION",rr.getBooking().getBookingCode()+" -> "+s);notifications.send(rr.getBooking().getTourist(),notifications.userByEmail(a.getName()),"Refund request "+s.name().toLowerCase(Locale.ROOT),"Refund request for "+rr.getBooking().getBookingCode()+" is now "+s.name()+((rr.getDecisionNote()==null||rr.getDecisionNote().isBlank())?"":". Note: "+rr.getDecisionNote()),"REFUND");return rr;
    }

    private Booking ownedPayableBooking(Long bookingId, Authentication a) {
        Booking b = bookings.findById(bookingId).orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!b.getTourist().getEmail().equalsIgnoreCase(a.getName())) throw new IllegalArgumentException("Not your booking");
        if (b.getBookingStatus() == BookingStatus.CANCELLED) throw new IllegalStateException("Cancelled booking cannot be paid");
        if (b.getBookingStatus() != BookingStatus.CONFIRMED)
            throw new IllegalStateException("Waiting for Safari Operator confirmation. Payment will be available once your booking is confirmed.");
        if (b.getPaymentStatus() == PaymentStatus.PAID) throw new IllegalStateException("Booking has already been paid");
        if (b.getPaymentStatus() == PaymentStatus.PENDING) throw new IllegalStateException("A bank payment is already pending Finance approval");
        return b;
    }

    private static String cleanReason(String value) {
        if (value == null) return null;
        String v = value.trim();
        if (v.isEmpty()) return null;
        if (v.length() > 1000) throw new IllegalArgumentException("Reason must be 1000 characters or less");
        return v;
    }

    private static String safeFilename(String name) {
        if (name == null || name.isBlank()) return "bank-payment-slip.pdf";
        return name.replaceAll("[^A-Za-z0-9._ -]", "_");
    }
}
