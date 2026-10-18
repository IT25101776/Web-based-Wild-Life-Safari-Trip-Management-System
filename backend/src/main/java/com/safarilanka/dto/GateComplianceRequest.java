package com.safarilanka.dto;

import jakarta.validation.constraints.*;

public record GateComplianceRequest(
        @NotNull Long permitId,
        @NotBlank @Size(max=255) String gateName,
        @Size(max=255) String vehicleRegistration,
        boolean permitVerified,
        boolean visitorCountVerified,
        boolean vehicleVerified,
        boolean guideVerified,
        boolean driverVerified,
        @NotBlank String complianceStatus,
        @Size(max=1500) String notes
) {}
