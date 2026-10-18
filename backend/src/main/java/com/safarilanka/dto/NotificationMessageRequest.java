package com.safarilanka.dto;
import jakarta.validation.constraints.*;
public record NotificationMessageRequest(
        @NotBlank @Size(max=180) String title,
        @NotBlank @Size(max=2500) String message
) {}
