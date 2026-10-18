package com.safarilanka.service.payment;

import com.safarilanka.dto.PaymentRequest;
import com.safarilanka.model.*;
import com.safarilanka.repository.BookingRepository;
import com.safarilanka.repository.PaymentRepository;
import com.safarilanka.service.AuditService;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.UUID;

/** Concrete Strategy: processes card payments. */
@Component
public class CardPaymentStrategy implements PaymentStrategy {
    private final PaymentRepository payments;
    private final BookingRepository bookings;
    private final AuditService audit;

    public CardPaymentStrategy(PaymentRepository payments, BookingRepository bookings, AuditService audit) {
        this.payments = payments;
        this.bookings = bookings;
        this.audit = audit;
    }

    @Override
    public PaymentMethod supports() {
        return PaymentMethod.CARD;
    }

    @Override
    public Payment process(PaymentStrategyCommand command) {
        Booking booking = command.booking();
        PaymentRequest request = command.cardRequest();
        if (request == null) throw new IllegalArgumentException("Card payment details are required");

        if (!request.cardNumber().matches("[0-9 ]+")) {
            throw new IllegalArgumentException("Card number may contain digits and formatting spaces only");
        }
        String digits = request.cardNumber().replace(" ", "");
        if (!digits.matches("\\d{16}")) {
            throw new IllegalArgumentException("Card number must contain exactly 16 digits");
        }

        validateExpiry(request.expiry());
        if (!request.cvv().matches("\\d{3,4}")) {
            throw new IllegalArgumentException("Card security code must contain 3 or 4 digits");
        }

        Payment payment = basePayment(booking, PaymentMethod.CARD);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());
        payment.setCardBrand(null);
        payment.setCardLast4(digits.substring(12));
        payment.setRejectionReason(null);
        payment.setTransactionReference("CARD-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        payments.save(payment);

        // Booking confirmation remains controlled by Safari Operations.
        booking.setPaymentStatus(PaymentStatus.PAID);
        bookings.save(booking);
        audit.log(command.actorEmail(), "CARD_PAYMENT_SUCCESS",
                payment.getPaymentCode() + " / " + booking.getBookingCode() + " / ****" + payment.getCardLast4());
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

    private static void validateExpiry(String expiry) {
        try {
            String[] parts = expiry.split("/");
            if (parts.length != 2 || !parts[0].matches("\\d{2}") || !parts[1].matches("\\d{2}")) {
                throw new IllegalArgumentException("Expiry must use MM/YY format");
            }
            int month = Integer.parseInt(parts[0]);
            int year = 2000 + Integer.parseInt(parts[1]);
            if (month < 1 || month > 12) {
                throw new IllegalArgumentException("Expiry month must be between 01 and 12");
            }

            YearMonth expiryMonth = YearMonth.of(year, month);
            YearMonth currentMonth = YearMonth.now();
            if (expiryMonth.isBefore(currentMonth)) throw new IllegalArgumentException("Card is expired");
            if (expiryMonth.isAfter(currentMonth.plusYears(10))) {
                throw new IllegalArgumentException("Expiry date cannot be more than 10 years from the current month");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Expiry must use a valid MM/YY value");
        }
    }
}
