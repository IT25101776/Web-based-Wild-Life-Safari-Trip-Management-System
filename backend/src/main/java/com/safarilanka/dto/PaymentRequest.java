package com.safarilanka.dto;

import jakarta.validation.constraints.*;

public record PaymentRequest(
        @NotBlank String cardholderName,
        @NotBlank String cardNumber,
        @NotBlank @Pattern(regexp="^(0[1-9]|1[0-2])/\\d{2}$", message="Expiry must use MM/YY") String expiry,
        @NotBlank @Pattern(regexp="^\\d{3,4}$", message="CVV must contain 3 or 4 digits") String cvv
) {}
