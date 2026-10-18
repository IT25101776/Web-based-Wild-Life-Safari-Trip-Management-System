package com.safarilanka.dto; import jakarta.validation.constraints.*; import java.time.*; public record MaintenanceRequest(@NotNull LocalDate serviceDate,@NotBlank String description,String status){}
