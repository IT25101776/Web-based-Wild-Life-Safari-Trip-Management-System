package com.safarilanka.service;

import com.safarilanka.model.Role;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;

/** Email naming policy for administrator-created staff accounts. */
public final class RoleLoginEmailPolicy {
    private static final Map<Role,String> DOMAINS = Map.of(
            Role.SAFARI_OPERATOR, "operator.safarilanka.lk",
            Role.SAFARI_GUIDE, "guide.safarilanka.lk",
            Role.JEEP_DRIVER, "driver.safarilanka.lk",
            Role.PARK_OFFICER, "park.safarilanka.lk",
            Role.FINANCE_MANAGER, "finance.safarilanka.lk",
            Role.SYSTEM_ADMIN, "admin.safarilanka.lk"
    );

    private RoleLoginEmailPolicy() {}

    public static boolean isStaffRole(Role role) {
        return role != null && DOMAINS.containsKey(role);
    }

    public static String emailFor(String fullName, Role role) {
        if (!isStaffRole(role)) throw new IllegalArgumentException("Select a staff role. Tourist accounts are created from the public registration page.");
        String raw = fullName == null ? "" : Normalizer.normalize(fullName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", ".")
                .replaceAll("^\\.+|\\.+$", "")
                .replaceAll("\\.{2,}", ".");
        if (raw.isBlank()) throw new IllegalArgumentException("Enter a valid full name before creating the staff login");
        return raw + "@" + DOMAINS.get(role);
    }

    public static String domainFor(Role role) {
        return DOMAINS.get(role);
    }
}
