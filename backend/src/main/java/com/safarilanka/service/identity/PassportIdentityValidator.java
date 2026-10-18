package com.safarilanka.service.identity;

import java.util.Locale;

/** Concrete Factory product for passport validation. */
public class PassportIdentityValidator implements IdentityValidator {
    @Override
    public void validate(String value) {
        String id = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!id.matches("[A-Z0-9]{6,20}")) {
            throw new IllegalArgumentException("Passport must contain 6 to 20 letters/numbers only");
        }
    }
}
