package com.safarilanka.service.payment;

import com.safarilanka.dto.PaymentRequest;
import com.safarilanka.model.Booking;
import org.springframework.web.multipart.MultipartFile;

/**
 * Input passed from PaymentContext to the selected payment strategy.
 * Only the fields needed by the selected strategy are populated.
 */
public record PaymentStrategyCommand(
        Booking booking,
        PaymentRequest cardRequest,
        String bankReference,
        MultipartFile bankSlip,
        String actorEmail
) {
    public static PaymentStrategyCommand card(Booking booking, PaymentRequest request, String actorEmail) {
        return new PaymentStrategyCommand(booking, request, null, null, actorEmail);
    }

    public static PaymentStrategyCommand bank(Booking booking, String bankReference, MultipartFile bankSlip, String actorEmail) {
        return new PaymentStrategyCommand(booking, null, bankReference, bankSlip, actorEmail);
    }
}
