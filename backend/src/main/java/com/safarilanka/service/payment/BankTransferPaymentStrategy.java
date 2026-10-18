package com.safarilanka.service.payment;

import com.safarilanka.model.*;
import com.safarilanka.repository.BookingRepository;
import com.safarilanka.repository.PaymentRepository;
import com.safarilanka.service.AuditService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/** Concrete Strategy: processes bank-transfer submissions. */
@Component
public class BankTransferPaymentStrategy implements PaymentStrategy {
    private final PaymentRepository payments;
    private final BookingRepository bookings;
    private final AuditService audit;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public BankTransferPaymentStrategy(PaymentRepository payments, BookingRepository bookings, AuditService audit) {
        this.payments = payments;
        this.bookings = bookings;
        this.audit = audit;
    }

    @Override
    public PaymentMethod supports() {
        return PaymentMethod.BANK_TRANSFER;
    }

    @Override
    public Payment process(PaymentStrategyCommand command) throws IOException {
        Booking booking = command.booking();
        String bankReference = command.bankReference();
        MultipartFile slip = command.bankSlip();

        if (bankReference == null || bankReference.trim().length() < 3 || bankReference.trim().length() > 80) {
            throw new IllegalArgumentException("Bank deposit/reference number must be 3 to 80 characters");
        }
        if (slip == null || slip.isEmpty()) {
            throw new IllegalArgumentException("Please upload the bank payment slip PDF");
        }

        String original = Optional.ofNullable(slip.getOriginalFilename()).orElse("payment-slip.pdf");
        String contentType = Optional.ofNullable(slip.getContentType()).orElse("");
        if (!original.toLowerCase(Locale.ROOT).endsWith(".pdf") || !MediaType.APPLICATION_PDF_VALUE.equalsIgnoreCase(contentType)) {
            throw new IllegalArgumentException("Bank payment slip must be a PDF file");
        }
        if (slip.getSize() > 10L * 1024 * 1024) {
            throw new IllegalArgumentException("Bank payment slip must be 10 MB or smaller");
        }
        if (!looksLikePdf(slip)) {
            throw new IllegalArgumentException("Uploaded file is not a valid PDF");
        }

        Path dir = Path.of(uploadDir, "bank-slips").toAbsolutePath().normalize();
        Files.createDirectories(dir);
        String stored = "BANK-" + booking.getId() + "-" + UUID.randomUUID() + ".pdf";
        Path target = dir.resolve(stored).normalize();
        if (!target.startsWith(dir)) throw new IllegalStateException("Invalid upload path");
        slip.transferTo(target);

        Payment payment = basePayment(booking, PaymentMethod.BANK_TRANSFER);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setRejectionReason(null);
        payment.setTransactionReference(bankReference.trim());
        payment.setBankSlipFileName(original.replaceAll("[\\r\\n]", ""));
        payment.setBankSlipPath(target.toString());
        payments.save(payment);

        booking.setPaymentStatus(PaymentStatus.PENDING);
        bookings.save(booking);
        audit.log(command.actorEmail(), "BANK_PAYMENT_SUBMITTED",
                payment.getPaymentCode() + " / " + booking.getBookingCode());
        return payment;
    }

    private static Payment basePayment(Booking booking, PaymentMethod method) {
        Payment payment = new Payment();
        String shortId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        payment.setPaymentCode("PAY-" + shortId);
        payment.setBooking(booking);
        payment.setAmount(booking.getTotalAmount());
        payment.setMethod(method);
        payment.setInvoiceNumber("INV-YALA-" + shortId);
        return payment;
    }

    private static boolean looksLikePdf(MultipartFile file) throws IOException {
        byte[] bytes = file.getInputStream().readNBytes(5);
        return bytes.length == 5 && new String(bytes).equals("%PDF-");
    }
}
