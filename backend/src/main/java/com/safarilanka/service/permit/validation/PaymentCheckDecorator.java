package com.safarilanka.service.permit.validation;

import com.safarilanka.model.Booking;
import com.safarilanka.model.PaymentStatus;

/** Adds payment approval validation to the wrapped validator. */
public class PaymentCheckDecorator extends PermitValidatorDecorator {
    public PaymentCheckDecorator(PermitValidator next) { super(next); }

    @Override
    public void validate(Booking booking) {
        next.validate(booking);
        if (booking.getPaymentStatus() != PaymentStatus.PAID)
            throw new IllegalStateException("Payment must be successful before the permit can be reviewed");
    }
}
