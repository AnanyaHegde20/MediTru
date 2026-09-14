package com.meditru.dto;

public record ClinicalNotesRequest(
    String patientName,
    Integer age,
    String symptoms,
    String vitals,
    String consultationTranscript
) {}
