package com.safarilanka.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

/**
 * Booking request using visitor-category counts instead of individual visitor PII.
 * visitorCount/visitors remain optional for backward compatibility with older clients,
 * but the server now calculates the total from adults + child categories.
 */
public record BookingRequest(
        @NotNull Long packageId,
        @NotNull @Future(message="Same-day bookings are not allowed. Choose a date from tomorrow onward.") LocalDate visitDate,
        Integer adults,
        Integer childFiveToEleven,
        Integer childBelowFive,
        Integer visitorCount,
        @NotBlank @Size(max=120) @Pattern(regexp="^[\\p{L} .'-]+$", message="Group leader name contains invalid characters") String groupLeaderName,
        @NotBlank @Pattern(regexp="^[0-9]{9,12}$", message="Contact phone must contain 9 to 12 digits only") String contactPhone,
        @NotBlank @Pattern(regexp="^[0-9]{9,12}$", message="Emergency contact must contain 9 to 12 digits only") String emergencyContact,
        @Size(max=1500) String specialRequirements,
        List<VisitorInput> visitors
) {
    public int resolvedAdults() {
        if (adults != null) return adults;
        return visitorCount == null ? 1 : visitorCount;
    }
    public int resolvedChildFiveToEleven() { return childFiveToEleven == null ? 0 : childFiveToEleven; }
    public int resolvedChildBelowFive() { return childBelowFive == null ? 0 : childBelowFive; }
    public int resolvedVisitorCount() { return resolvedAdults() + resolvedChildFiveToEleven() + resolvedChildBelowFive(); }
}
