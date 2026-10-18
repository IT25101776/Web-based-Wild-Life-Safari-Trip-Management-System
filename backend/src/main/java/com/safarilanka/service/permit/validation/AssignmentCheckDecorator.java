package com.safarilanka.service.permit.validation;

import com.safarilanka.model.*;
import com.safarilanka.repository.TripAssignmentRepository;

/** Adds complete safari-team assignment validation. */
public class AssignmentCheckDecorator extends PermitValidatorDecorator {
    private final TripAssignmentRepository assignments;

    public AssignmentCheckDecorator(PermitValidator next, TripAssignmentRepository assignments) {
        super(next);
        this.assignments = assignments;
    }

    @Override
    public void validate(Booking booking) {
        next.validate(booking);
        long assigned = assignments.findByBookingIdOrderByIdAsc(booking.getId()).stream()
                .filter(x -> x.getStatus() != AssignmentStatus.CANCELLED && x.getStatus() != AssignmentStatus.DECLINED)
                .count();
        int required = Math.max(1, booking.getVehicleCount());
        if (assigned < required)
            throw new IllegalStateException("Safari Operations must assign all required vehicles, drivers and guides before the permit can be reviewed");
    }
}
