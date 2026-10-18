package com.safarilanka.service.identity;

import java.util.Locale;

/** Concrete Factory product for Sri Lankan NIC validation. */
public class NicIdentityValidator implements IdentityValidator {
    @Override
    public void validate(String value) {
        String id = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!id.matches("(?:\\d{12}|\\d{9}V)")) {
            throw new IllegalArgumentException("NIC must contain either 12 digits or 9 digits followed by V");
        }
    }
}
