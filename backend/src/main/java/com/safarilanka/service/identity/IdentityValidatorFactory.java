package com.safarilanka.service.identity;

import org.springframework.stereotype.Component;

/**
 * Member 1 - Factory Pattern.
 * Centralizes creation of the correct identity validator without exposing concrete classes to controllers.
 */
@Component
public class IdentityValidatorFactory {
    public IdentityValidator create(String identityType) {
        if ("NIC".equalsIgnoreCase(identityType)) return new NicIdentityValidator();
        if ("PASSPORT".equalsIgnoreCase(identityType)) return new PassportIdentityValidator();
        throw new IllegalArgumentException("Invalid visitor ID type");
    }
}
