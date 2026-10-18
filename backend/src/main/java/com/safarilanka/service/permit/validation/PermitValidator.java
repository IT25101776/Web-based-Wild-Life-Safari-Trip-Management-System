package com.safarilanka.service.permit.validation;

import com.safarilanka.model.Booking;

/** Member 6 - Component interface for the Decorator Pattern. */
public interface PermitValidator {
    void validate(Booking booking);
}
