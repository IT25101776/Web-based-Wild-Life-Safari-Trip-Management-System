package com.safarilanka.dto;

import jakarta.validation.constraints.*;

public record VisitorInput(
        @NotBlank @Size(max=120) @Pattern(regexp="^[\\p{L} .'-]+$", message="Visitor name may contain letters, spaces, apostrophes, periods and hyphens only") String fullName,
        @NotBlank @Pattern(regexp="NIC|PASSPORT", message="ID type must be NIC or PASSPORT") String idType,
        @NotBlank @Size(max=20) String idNumber,
        @NotBlank @Size(max=80) @Pattern(regexp="^[\\p{L} .'-]+$", message="Nationality may contain letters and spaces only") String nationality,
        @NotNull @Min(value=1, message="Age must be between 1 and 99") @Max(value=99, message="Age must be between 1 and 99") Integer age
) {}
