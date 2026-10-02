package com.meditru.util;

import java.util.Locale;

public final class Filters {

    private Filters() {}

    public static boolean matches(String query, String... fields) {
        if (query == null || query.isBlank()) {
            return true;
        }
        String needle = query.trim().toLowerCase(Locale.ROOT);
        for (String field : fields) {
            if (field != null && field.toLowerCase(Locale.ROOT).contains(needle)) {
                return true;
            }
        }
        return false;
    }

    public static boolean statusMatches(String status, String actual) {
        if (status == null || status.isBlank()) {
            return true;
        }
        return status.equalsIgnoreCase(actual);
    }
}
