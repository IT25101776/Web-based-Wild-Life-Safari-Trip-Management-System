package com.safarilanka.service;

import java.util.Locale;

/**
 * Sri Lankan driving-licence normalizer/validator used by Driver accounts.
 * Supported project formats:
 *   - Legacy alphanumeric: one letter + seven digits, e.g. B1234567
 *   - Current numeric card style: two digits + hyphen + seven digits, e.g. 85-1234567
 *     (the user may type the numeric form without the hyphen; it is normalized automatically)
 */
public final class DrivingLicenseValidator {
    private DrivingLicenseValidator() {}

    public static String normalize(String value) {
        if (value == null) return null;
        String v = value.toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", "")
                .replace('–', '-')
                .replace('—', '-');
        if (v.isBlank()) return null;

        // Accept 9 consecutive digits and store them in the current card style NN-NNNNNNN.
        if (v.matches("\\d{9}")) {
            v = v.substring(0, 2) + "-" + v.substring(2);
        }
        return v;
    }

    public static boolean isValid(String value) {
        String v = normalize(value);
        if (v == null) return false;
        return v.matches("[A-Z]\\d{7}") || v.matches("\\d{2}-\\d{7}");
    }

    public static String requireValid(String value) {
        String v = normalize(value);
        if (!isValid(v)) {
            throw new IllegalArgumentException(
                    "Enter a valid Sri Lankan driving licence number. Supported formats: B1234567 or 85-1234567.");
        }
        return v;
    }
}
