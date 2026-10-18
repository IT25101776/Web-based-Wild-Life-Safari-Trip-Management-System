package com.safarilanka.service.payment;

import com.safarilanka.model.Payment;
import com.safarilanka.model.PaymentMethod;

import java.io.IOException;

/**
 * Strategy interface for payment processing.
 * Each payment method encapsulates its own validation and processing rules.
 */
public interface PaymentStrategy {
    PaymentMethod supports();
    Payment process(PaymentStrategyCommand command) throws IOException;
}
