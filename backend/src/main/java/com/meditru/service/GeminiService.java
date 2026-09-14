package com.meditru.service;

import com.meditru.config.MeditruProperties;
import com.meditru.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String GEMINI_API_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final MeditruProperties properties;
    private final RestTemplate restTemplate;

    public GeminiService(MeditruProperties properties) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
    }

    public boolean isConfigured() {
        String apiKey = properties.getGemini().getApiKey();
        return apiKey != null && !apiKey.isBlank();
    }

    public HealthAssistantResponse generateHealthResponse(
            String message, String reportContext, List<ChatHistoryEntry> history) {

        if (!isConfigured()) {
            return buildHealthFallback(message);
        }

        try {
            String prompt = PromptBuilder.buildHealthPrompt(message, reportContext, history);
            String model = properties.getGemini().getModel();
            String apiKey = properties.getGemini().getApiKey();

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "systemInstruction", Map.of("parts", List.of(
                    Map.of("text", PromptBuilder.HEALTH_ASSISTANT_SYSTEM_INSTRUCTION)
                )),
                "generationConfig", Map.of("temperature", 0.4)
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = GEMINI_API_URL.formatted(model, apiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            String reply = extractText(response.getBody());
            if (reply == null || reply.isBlank()) {
                reply = "I was unable to generate a clinical response at this moment. Please consult your physician.";
            }

            return HealthAssistantResponse.success(reply);
        } catch (Exception e) {
            log.error("[MediTru] Health assistant error: {}", e.getMessage());
            throw new RuntimeException("Failed to generate health advice", e);
        }
    }

    public ClinicalNotesResponse generateClinicalNotes(ClinicalNotesRequest request) {
        if (!isConfigured()) {
            return buildClinicalNotesFallback(request.patientName(), request.vitals());
        }

        try {
            String prompt = PromptBuilder.buildClinicalNotesPrompt(
                request.patientName(), request.age(), request.symptoms(),
                request.vitals(), request.consultationTranscript()
            );
            String model = properties.getGemini().getModel();
            String apiKey = properties.getGemini().getApiKey();

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "systemInstruction", Map.of("parts", List.of(
                    Map.of("text", PromptBuilder.CLINICAL_NOTES_SYSTEM_INSTRUCTION)
                ))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = GEMINI_API_URL.formatted(model, apiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            String notesText = extractText(response.getBody());
            if (notesText == null) notesText = "";

            return ClinicalNotesResponse.success(notesText);
        } catch (Exception e) {
            log.error("[MediTru] Clinical notes error: {}", e.getMessage());
            throw new RuntimeException("Failed to generate clinical notes", e);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> responseBody) {
        if (responseBody == null) return null;
        try {
            var candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) return null;
            var content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) return null;
            var parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) return null;
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.warn("[MediTru] Failed to parse Gemini response: {}", e.getMessage());
            return null;
        }
    }

    private HealthAssistantResponse buildHealthFallback(String message) {
        String truncated = message.length() > 45 ? message.substring(0, 45) : message;
        String reply = """
            Based on your query regarding "%s...", here is general medical educational context:

            • **Overview**: Common factors include hydration levels, sleep hygiene, and stress.
            • **Recommended Step**: Monitor symptoms for 24-48 hours. If fever >101°F or sharp localized pain occurs, seek medical evaluation.
            • **Next Step**: We suggest scheduling a routine follow-up with our General Medicine or Cardiology specialists.
            """.formatted(truncated);

        return HealthAssistantResponse.fallback(reply,
            List.of("Schedule consultation with Dr. Alan Stone", "Learn about preventative care"));
    }

    private ClinicalNotesResponse buildClinicalNotesFallback(String patientName, String vitals) {
        String name = patientName != null ? patientName : "Patient";
        String objective = (vitals != null && !vitals.isBlank())
            ? vitals
            : "BP: 120/80 mmHg, HR: 72 bpm, SpO2: 98%, Temp: 98.6\u00B0F.";

        String notesJson = """
            {"subjective":"Patient %s presents for follow-up evaluation. Reports persistent symptoms as described.","objective":"%s","assessment":"Stable clinical baseline with mild symptom manifestation requiring active monitoring.","plan":"1. Continue prescribed medication.\\n2. Schedule follow-up in 4 weeks.\\n3. Routine blood panel ordered."}
            """.formatted(name, objective);

        return ClinicalNotesResponse.fallback(notesJson);
    }
}
