package com.safarilanka.service;

import com.safarilanka.model.Role;
import com.safarilanka.model.User;

public final class UserProfileRules {
    private UserProfileRules() {}

    public static void apply(User u, String fullName, String phone, String address,
                             String qualifications, String languages, String licenseNumber) {
        String name = clean(fullName);
        if (name == null || name.length() < 2) throw new IllegalArgumentException("Full name is required");
        if (phone != null && !phone.isBlank() && !phone.matches("\\d{9,12}"))
            throw new IllegalArgumentException("Phone must contain 9 to 12 digits only");

        u.setFullName(name);
        u.setPhone(clean(phone));

        Role role = u.getRole();
        if (role == Role.TOURIST) {
            u.setAddress(clean(address));
            u.setQualifications(null);
            u.setLanguages(null);
            u.setLicenseNumber(null);
        } else if (role == Role.SAFARI_GUIDE) {
            String q = clean(qualifications);
            String l = clean(languages);
            if (q == null) throw new IllegalArgumentException("Safari guide qualifications are required");
            if (l == null) throw new IllegalArgumentException("Safari guide languages are required");
            u.setAddress(null);
            u.setQualifications(q);
            u.setLanguages(l);
            // Safari guides do not require a driving licence in this system.
            u.setLicenseNumber(null);
        } else if (role == Role.JEEP_DRIVER) {
            String licence = DrivingLicenseValidator.requireValid(licenseNumber);
            u.setAddress(null);
            u.setQualifications(null);
            u.setLanguages(null);
            u.setLicenseNumber(licence);
        } else {
            u.setAddress(null);
            u.setQualifications(null);
            u.setLanguages(null);
            u.setLicenseNumber(null);
        }
    }

    public static void normalizeForRole(User u) {
        apply(u, u.getFullName(), u.getPhone(), u.getAddress(), u.getQualifications(), u.getLanguages(), u.getLicenseNumber());
    }

    private static String clean(String s) {
        if (s == null) return null;
        String v = s.trim();
        return v.isEmpty() ? null : v;
    }
}
