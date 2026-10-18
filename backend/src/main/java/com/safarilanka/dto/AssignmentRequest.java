package com.safarilanka.dto;

import jakarta.validation.constraints.NotNull;

/**
 * A safari vehicle is derived from the selected driver's linked vehicle.
 * The operator therefore only chooses a driver and a guide.
 */
public record AssignmentRequest(
        @NotNull Long driverId,
        @NotNull Long guideId
) {}
