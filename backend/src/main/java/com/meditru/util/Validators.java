package com.meditru.util;

public final class Validators {

    private Validators() {}

    /**
     * Strips angle brackets, trims whitespace, and truncates to maxLength.
     */
    public static String sanitize(String input, int maxLength) {
        if (input == null) return "";
        return input
            .replace("<", "")
            .replace(">", "")
            .trim()
            .substring(0, Math.min(input.trim().length(), maxLength));
    }

    /**
     * Returns true if val is a non-empty string within maxLength.
     */
    public static boolean isNonEmptyString(Object val, int maxLength) {
        if (val == null) return false;
        if (!(val instanceof String s)) return false;
        String trimmed = s.trim();
        return !trimmed.isEmpty() && trimmed.length() <= maxLength;
    }
}
