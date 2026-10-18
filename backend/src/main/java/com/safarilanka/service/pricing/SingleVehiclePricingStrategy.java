package com.safarilanka.service.pricing;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;

/** Concrete strategy used when one vehicle is enough. */
@Component
public class SingleVehiclePricingStrategy implements PricingStrategy {
    @Override
    public PricingResult calculate(BigDecimal pricePerPerson, int visitors, int requiredVehicles, BigDecimal extraVehicleFee) {
        BigDecimal total = pricePerPerson.multiply(BigDecimal.valueOf(visitors));
        return new PricingResult(total, BigDecimal.ZERO);
    }

    @Override
    public boolean supports(int requiredVehicles) {
        return requiredVehicles <= 1;
    }
}
