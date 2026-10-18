package com.safarilanka.dto; import jakarta.validation.constraints.*; public record PermitValidationRequest(@NotBlank String permitCode,@NotBlank String action){}
