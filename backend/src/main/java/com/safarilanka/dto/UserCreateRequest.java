package com.safarilanka.dto;

import com.safarilanka.model.Role;
import jakarta.validation.constraints.*;

public record UserCreateRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @Size(min=6) String password,
        @NotNull Role role,
        String phone,
        String address,
        String qualifications,
        String languages,
        String licenseNumber,
        Long vehicleId
) {}
