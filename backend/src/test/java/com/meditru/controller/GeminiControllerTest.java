package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.dto.*;
import com.meditru.service.GeminiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class GeminiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GeminiService geminiService;

    @Test
    void healthAssistantReturnsResponse() throws Exception {
        var request = new HealthAssistantRequest("What is flu?", List.of(), null);
        when(geminiService.generateHealthResponse(anyString(), any(), anyList()))
            .thenReturn(new HealthAssistantResponse("Flu is a viral infection.", false, List.of()));

        mockMvc.perform(post("/api/gemini/health-assistant")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reply").value("Flu is a viral infection."));
    }

    @Test
    void healthAssistantRejectsEmptyMessage() throws Exception {
        var request = new HealthAssistantRequest("", List.of(), null);

        mockMvc.perform(post("/api/gemini/health-assistant")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Invalid input"));
    }

    @Test
    void clinicalNotesReturnsResponse() throws Exception {
        var request = new ClinicalNotesRequest("John Doe", 35, "fever", "Temp 101F", "Patient has cough");
        when(geminiService.generateClinicalNotes(any()))
            .thenReturn(new ClinicalNotesResponse("{\"subjective\":\"Patient presents\"}", false));

        mockMvc.perform(post("/api/gemini/clinical-notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.notesText").exists());
    }

    @Test
    void clinicalNotesRejectsEmptyPatientName() throws Exception {
        var request = new ClinicalNotesRequest("", 35, "fever", null, null);

        mockMvc.perform(post("/api/gemini/clinical-notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Invalid input"));
    }

    @Test
    void healthAssistantRejectsTooLongMessage() throws Exception {
        String longMessage = "a".repeat(5001);
        var request = new HealthAssistantRequest(longMessage, List.of(), null);

        mockMvc.perform(post("/api/gemini/health-assistant")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }
}
