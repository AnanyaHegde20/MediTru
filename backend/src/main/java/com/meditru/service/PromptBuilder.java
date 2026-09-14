package com.meditru.service;

import com.meditru.dto.ChatHistoryEntry;
import java.util.List;

public final class PromptBuilder {

    private PromptBuilder() {}

    public static final String HEALTH_ASSISTANT_SYSTEM_INSTRUCTION = """
        You are "MediTru AI Health Assistant", an empathetic, professional medical SaaS assistant inspired by Apple Health and modern clinical guidelines.
        Your duties:
        1. Provide accurate, clear, and reassuring health information, explain lab reports (like lipid panels, CBC, metabolic panels), and suggest relevant lifestyle precautions.
        2. Structure your answers with clean bullet points, bold key terms, and highlighted precautions.
        3. ALWAYS remind users: "I am an AI assistant and not a substitute for a licensed healthcare provider."
        4. If symptoms sound severe (e.g. chest pressure, sudden numbness, difficulty breathing), include an explicit emergency advisory tag [URGENT_CARE_RECOMMENDED].
        5. Keep your tone calm, trustworthy, and clear.
        """;

    public static final String CLINICAL_NOTES_SYSTEM_INSTRUCTION = """
        You are an AI Clinical Scribe for medical professionals. Return a concise, high-standard professional medical SOAP note with clear Subjective, Objective, Assessment, and Plan sections.
        """;

    public static String buildHealthPrompt(String message, String reportContext, List<ChatHistoryEntry> history) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("User query: ").append(message).append("\n");

        if (reportContext != null && !reportContext.isBlank()) {
            prompt.append("\nAttached Lab Report / Clinical Data: ").append(reportContext).append("\n");
        }

        if (history != null && !history.isEmpty()) {
            List<ChatHistoryEntry> recent = history.subList(
                Math.max(0, history.size() - 10), history.size()
            );
            prompt.append("\nRecent conversation history:\n");
            for (ChatHistoryEntry entry : recent) {
                String role = entry.role() != null ? entry.role() : "unknown";
                String text = entry.text() != null ? entry.text() : "";
                prompt.append(role).append(": ").append(text).append("\n");
            }
        }

        return prompt.toString();
    }

    public static String buildClinicalNotesPrompt(
            String patientName, Integer age, String symptoms, String vitals, String consultationTranscript) {
        String ageStr = age != null ? String.valueOf(age) : "N/A";
        String vitalsStr = (vitals != null && !vitals.isBlank())
            ? vitals
            : "BP: 124/82, HR: 74, SpO2: 99%";
        String symptomsStr = (symptoms != null && !symptoms.isBlank())
            ? symptoms
            : (consultationTranscript != null && !consultationTranscript.isBlank())
                ? consultationTranscript
                : "Routine check-up";

        return """
            Generate a structured SOAP (Subjective, Objective, Assessment, Plan) clinical summary for:
            Patient: %s, Age: %s
            Vitals: %s
            Patient Symptoms & Notes: %s
            """.formatted(patientName, ageStr, vitalsStr, symptomsStr);
    }
}
