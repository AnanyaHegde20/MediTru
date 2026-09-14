package com.meditru.controller;

import com.meditru.dto.*;
import com.meditru.service.GeminiService;
import com.meditru.util.Validators;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/gemini")
public class GeminiController {

    private final GeminiService geminiService;

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/health-assistant")
    public ResponseEntity<?> healthAssistant(@RequestBody HealthAssistantRequest request) {
        // Validate message
        if (!Validators.isNonEmptyString(request.message(), 5000)) {
            return ResponseEntity.badRequest().body(
                ApiErrorResponse.of("Invalid input", "'message' must be a non-empty string (max 5000 chars).")
            );
        }

        String cleanMessage = Validators.sanitize(request.message(), 5000);
        String cleanReportContext = Validators.isNonEmptyString(request.reportContext(), 10000)
            ? Validators.sanitize(request.reportContext(), 10000)
            : null;

        // Sanitize history
        List<ChatHistoryEntry> cleanHistory = new ArrayList<>();
        if (request.history() != null) {
            List<ChatHistoryEntry> recent = request.history().size() > 10
                ? request.history().subList(request.history().size() - 10, request.history().size())
                : request.history();
            for (ChatHistoryEntry entry : recent) {
                cleanHistory.add(new ChatHistoryEntry(
                    Validators.sanitize(entry.role(), 50),
                    Validators.sanitize(entry.text(), 2000)
                ));
            }
        }

        HealthAssistantResponse response = geminiService.generateHealthResponse(
            cleanMessage, cleanReportContext, cleanHistory
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/clinical-notes")
    public ResponseEntity<?> clinicalNotes(@RequestBody ClinicalNotesRequest request) {
        // Validate patientName
        if (!Validators.isNonEmptyString(request.patientName(), 200)) {
            return ResponseEntity.badRequest().body(
                ApiErrorResponse.of("Invalid input", "'patientName' must be a non-empty string (max 200 chars).")
            );
        }

        ClinicalNotesRequest cleanRequest = new ClinicalNotesRequest(
            Validators.sanitize(request.patientName(), 200),
            (request.age() != null && request.age() > 0 && request.age() < 150) ? request.age() : null,
            Validators.isNonEmptyString(request.symptoms(), 5000) ? Validators.sanitize(request.symptoms(), 5000) : null,
            Validators.isNonEmptyString(request.vitals(), 1000) ? Validators.sanitize(request.vitals(), 1000) : null,
            Validators.isNonEmptyString(request.consultationTranscript(), 10000)
                ? Validators.sanitize(request.consultationTranscript(), 10000) : null
        );

        ClinicalNotesResponse response = geminiService.generateClinicalNotes(cleanRequest);
        return ResponseEntity.ok(response);
    }
}
