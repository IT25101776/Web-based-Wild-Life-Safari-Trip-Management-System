package com.safarilanka.service.pricing;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;

/** Context class that delegates price calculation to the matching PricingStrategy. */
@Component
public class PricingContext {
    private final List<PricingStrategy> strategies;

    public PricingContext(List<PricingStrategy> strategies) {
        this.strategies = strategies;
    }

    public PricingResult calculate(BigDecimal pricePerPerson, int visitors, int requiredVehicles, BigDecimal extraVehicleFee) {
        PricingStrategy strategy = strategies.stream()
                .filter(x -> x.supports(requiredVehicles))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No pricing strategy is available"));
        return strategy.calculate(pricePerPerson, visitors, requiredVehicles, extraVehicleFee);
    }
}
