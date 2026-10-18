package com.safarilanka.service.pricing;

import java.math.BigDecimal;

/** Member 2 - Strategy interface for interchangeable safari pricing rules. */
public interface PricingStrategy {
    PricingResult calculate(BigDecimal pricePerPerson, int visitors, int requiredVehicles, BigDecimal extraVehicleFee);
    boolean supports(int requiredVehicles);
}
