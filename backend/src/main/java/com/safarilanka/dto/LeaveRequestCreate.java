package com.safarilanka.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
public record LeaveRequestCreate(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotBlank @Size(max=1000) String note
) {}
