package com.safarilanka.service.payment;

import com.safarilanka.model.Payment;
import com.safarilanka.model.PaymentMethod;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Context class in the Strategy Pattern.
 * It selects the correct PaymentStrategy at runtime based on PaymentMethod
 * and delegates the payment processing to that strategy.
 */
@Service
public class PaymentContext {
    private final Map<PaymentMethod, PaymentStrategy> strategies = new EnumMap<>(PaymentMethod.class);

    public PaymentContext(List<PaymentStrategy> availableStrategies) {
        for (PaymentStrategy strategy : availableStrategies) {
            strategies.put(strategy.supports(), strategy);
        }
    }

    public Payment process(PaymentMethod method, PaymentStrategyCommand command) throws IOException {
        PaymentStrategy strategy = strategies.get(method);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported payment method: " + method);
        }
        return strategy.process(command);
    }
}
