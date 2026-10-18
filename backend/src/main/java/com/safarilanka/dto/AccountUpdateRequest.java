package com.safarilanka.dto;

import java.time.LocalDate;

public record AccountUpdateRequest(
        String fullName,
        String phone,
        String address,
        String qualifications,
        String languages,
        String licenseNumber,
        String country,
        String preferredCurrency,
        String preferredLanguage,
        String gender,
        LocalDate birthDate,
        String identityType,
        String identityNumber,
        String newPassword
) {}
