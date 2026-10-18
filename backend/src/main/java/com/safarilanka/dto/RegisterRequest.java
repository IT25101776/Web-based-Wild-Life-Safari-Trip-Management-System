package com.safarilanka.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank(message="Full name is required") String fullName,
        @Email(message="Enter a valid email address containing @") @NotBlank(message="Email is required") String email,
        @NotBlank(message="Password is required") @Size(min=8, message="Password must contain at least 8 characters")
        @Pattern(regexp="^(?=.*[A-Za-z])(?=.*\\d).{8,}$", message="Password must include at least one letter and one number") String password,
        @NotBlank(message="Phone number is required")
        @Pattern(regexp="^0\\d{9}$", message="Phone number must contain exactly 10 digits and start with 0") String phone,
        @NotBlank(message="Country is required") String country,
        @NotBlank(message="Preferred currency is required") @Pattern(regexp="^[A-Z]{3}$", message="Invalid currency code") String preferredCurrency,
        @NotBlank(message="System language is required") @Pattern(regexp="ENGLISH|SINHALA|TAMIL|HINDI|CHINESE", message="Invalid system language") String preferredLanguage,
        @NotBlank(message="Gender is required") @Pattern(regexp="MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY", message="Invalid gender") String gender,
        @NotNull(message="Birthday is required") @Past(message="Birthday must be in the past") LocalDate birthDate,
        @NotBlank(message="Identity type is required") @Pattern(regexp="NIC|PASSPORT", message="Identity type must be NIC or PASSPORT") String identityType,
        @NotBlank(message="NIC or passport number is required") @Size(max=20) String identityNumber
){}
