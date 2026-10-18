package com.safarilanka.service.pricing;

import java.math.BigDecimal;

/** Result returned by a pricing strategy. */
public record PricingResult(BigDecimal totalAmount, BigDecimal vehicleSurcharge) {}
