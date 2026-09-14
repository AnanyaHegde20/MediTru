package com.meditru.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ValidatorsTest {

    @Test
    void sanitizeStripsAngleBrackets() {
        assertEquals("scriptalert/script", Validators.sanitize("<script>alert</script>", 100));
    }

    @Test
    void sanitizeTrimsWhitespace() {
        assertEquals("hello", Validators.sanitize("  hello  ", 100));
    }

    @Test
    void sanitizeTruncatesToMaxLength() {
        assertEquals("hello", Validators.sanitize("hello world", 5));
    }

    @Test
    void sanitizeReturnsEmptyForNull() {
        assertEquals("", Validators.sanitize(null, 100));
    }

    @Test
    void sanitizeReturnsEmptyForBlank() {
        assertEquals("", Validators.sanitize("   ", 100));
    }

    @Test
    void sanitizeHandlesShortInputGracefully() {
        assertEquals("hi", Validators.sanitize("hi", 100));
    }

    @Test
    void isNonEmptyStringReturnsTrueForValidInput() {
        assertTrue(Validators.isNonEmptyString("hello", 100));
    }

    @Test
    void isNonEmptyStringReturnsFalseForNull() {
        assertFalse(Validators.isNonEmptyString(null, 100));
    }

    @Test
    void isNonEmptyStringReturnsFalseForEmpty() {
        assertFalse(Validators.isNonEmptyString("", 100));
    }

    @Test
    void isNonEmptyStringReturnsFalseForWhitespace() {
        assertFalse(Validators.isNonEmptyString("   ", 100));
    }

    @Test
    void isNonEmptyStringReturnsFalseForNonString() {
        assertFalse(Validators.isNonEmptyString(123, 100));
    }

    @Test
    void isNonEmptyStringReturnsFalseWhenExceedsMaxLength() {
        assertFalse(Validators.isNonEmptyString("hello world", 5));
    }
}
