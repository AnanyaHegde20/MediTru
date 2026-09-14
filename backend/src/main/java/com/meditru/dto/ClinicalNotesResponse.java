package com.meditru.dto;

public record ClinicalNotesResponse(
    String notesText,
    boolean isFallback
) {
    public static ClinicalNotesResponse success(String notesText) {
        return new ClinicalNotesResponse(notesText, false);
    }

    public static ClinicalNotesResponse fallback(String notesText) {
        return new ClinicalNotesResponse(notesText, true);
    }
}
