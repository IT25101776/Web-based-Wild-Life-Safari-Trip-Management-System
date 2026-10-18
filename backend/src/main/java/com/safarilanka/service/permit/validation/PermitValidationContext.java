package com.safarilanka.service.permit.validation;

import com.safarilanka.model.Booking;
import com.safarilanka.repository.TripAssignmentRepository;
import org.springframework.stereotype.Component;

/** Builds and executes the permit-validation decorator chain. */
@Component
public class PermitValidationContext {
    private final TripAssignmentRepository assignments;

    public PermitValidationContext(TripAssignmentRepository assignments) {
        this.assignments = assignments;
    }

    public void validateForReview(Booking booking) {
        PermitValidator validator = new BasicPermitValidator();
        validator = new PaymentCheckDecorator(validator);
        validator = new BookingConfirmationDecorator(validator);
        validator = new AssignmentCheckDecorator(validator, assignments);
        validator.validate(booking);
    }
}
