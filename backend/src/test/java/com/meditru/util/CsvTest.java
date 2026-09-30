package com.meditru.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CsvTest {

    @Test
    void escapesCommasQuotesAndLineBreaks() {
        assertEquals("plain", Csv.escape("plain"));
        assertEquals("\"a,b\"", Csv.escape("a,b"));
        assertEquals("\"say \"\"hi\"\"\"", Csv.escape("say \"hi\""));
        assertEquals("\"line1\nline2\"", Csv.escape("line1\nline2"));
        assertEquals("", Csv.escape(null));
    }

    @Test
    void rowJoinsEscapedValuesAndEndsWithLineBreak() {
        assertEquals("a,\"b,c\",d\r\n", Csv.row("a", "b,c", "d"));
        assertEquals("\r\n", Csv.row());
    }
}
