package com.safarilanka.service.pricing;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;

/** Concrete strategy used when the visitor group requires multiple jeeps. */
@Component
public class MultiVehiclePricingStrategy implements PricingStrategy {
    @Override
    public PricingResult calculate(BigDecimal pricePerPerson, int visitors, int requiredVehicles, BigDecimal extraVehicleFee) {
        BigDecimal surcharge = extraVehicleFee.multiply(BigDecimal.valueOf(Math.max(0, requiredVehicles - 1)));
        BigDecimal total = pricePerPerson.multiply(BigDecimal.valueOf(visitors)).add(surcharge);
        return new PricingResult(total, surcharge);
    }

    @Override
    public boolean supports(int requiredVehicles) {
        return requiredVehicles > 1;
    }
}
