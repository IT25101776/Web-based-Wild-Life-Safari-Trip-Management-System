package com.safarilanka.service.permit.validation;

import com.safarilanka.model.Booking;
import com.safarilanka.model.BookingStatus;

/** Adds Safari Operator booking-confirmation validation. */
public class BookingConfirmationDecorator extends PermitValidatorDecorator {
    public BookingConfirmationDecorator(PermitValidator next) { super(next); }

    @Override
    public void validate(Booking booking) {
        next.validate(booking);
        if (booking.getBookingStatus() != BookingStatus.CONFIRMED)
            throw new IllegalStateException("Safari Operations must confirm the booking before the permit can be reviewed");
    }
}
