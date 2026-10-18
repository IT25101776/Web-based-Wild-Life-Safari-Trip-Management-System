package com.safarilanka.dto;
import jakarta.validation.constraints.*;
import java.math.*;
public record PackageRequest(
 @NotBlank String name,String description,@NotBlank String routeZone,@NotBlank String timeSlot,
 @NotNull @DecimalMin("0.01") BigDecimal pricePerPerson,
 @DecimalMin("0.00") BigDecimal additionalVehicleFee,
 @Min(1) int maxVisitors,@Min(1) int maxVehicles,boolean published,String imageUrl,String videoUrl,String duration){}
