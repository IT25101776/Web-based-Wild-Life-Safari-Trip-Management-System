package com.safarilanka.dto; import jakarta.validation.constraints.*; public record IncidentCreateRequest(@NotNull Long bookingId,@NotBlank String type,@NotBlank String details){}
