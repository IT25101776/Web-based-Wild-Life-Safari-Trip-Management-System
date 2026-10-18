package com.safarilanka.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record GuideRosterRequest(
        @NotNull @FutureOrPresent LocalDate rosterDate,
        @NotBlank String shift,
        Boolean available,
        @Size(max=500) String notes
) {}
