package com.safarilanka.service.permit.validation;

import com.safarilanka.model.Booking;

/** Concrete component with the basic booking-exists validation. */
public class BasicPermitValidator implements PermitValidator {
    @Override
    public void validate(Booking booking) {
        if (booking == null) throw new IllegalArgumentException("Booking is required for permit validation");
    }
}
