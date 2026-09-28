package com.meditru.service;

import com.meditru.config.MeditruProperties;
import com.meditru.dto.ClinicalNotesRequest;
import com.meditru.dto.ClinicalNotesResponse;
import com.meditru.dto.HealthAssistantResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GeminiServiceTest {

    private static MeditruProperties properties(String apiKey) {
        MeditruProperties props = new MeditruProperties();
        props.getGemini().setApiKey(apiKey);
        props.getGemini().setModel("gemini-test");
        return props;
    }

    private static RestTemplate failingRestTemplate() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
            .thenThrow(new ResourceAccessException("I/O error: read timeout"));
        return restTemplate;
    }

    private static RestTemplate respondingRestTemplate(String replyText) {
        RestTemplate restTemplate = mock(RestTemplate.class);
        Map<String, Object> body = Map.of("candidates", List.of(Map.of(
            "content", Map.of("parts", List.of(Map.of("text", replyText)))
        )));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));
        return restTemplate;
    }

    @Test
    void servesFallbackWhenUpstreamCallFails() {
        GeminiService service = new GeminiService(properties("test-key"), failingRestTemplate());

        HealthAssistantResponse response =
            service.generateHealthResponse("I have a headache", null, List.of());

        assertTrue(response.isFallback());
        assertTrue(response.reply().contains("headache"));
        assertTrue(response.reply().contains("not a substitute for a licensed healthcare provider"));
    }

    @Test
    void passesApiKeyViaHeaderNotQueryString() {
        RestTemplate restTemplate = respondingRestTemplate("Drink water and rest.");
        GeminiService service = new GeminiService(properties("secret-key-123"), restTemplate);

        HealthAssistantResponse response =
            service.generateHealthResponse("Headache remedies", null, List.of());

        assertFalse(response.isFallback());
        assertEquals("Drink water and rest.", response.reply());

        ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
        @SuppressWarnings({"unchecked", "rawtypes"})
        ArgumentCaptor<HttpEntity> entity = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(url.capture(), eq(HttpMethod.POST), entity.capture(), eq(Map.class));

        assertFalse(url.getValue().contains("key="));
        assertFalse(url.getValue().contains("secret-key-123"));
        assertEquals("secret-key-123", entity.getValue().getHeaders().getFirst("x-goog-api-key"));
    }

    @Test
    void servesFallbackWhenReplyIsEmpty() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        Map<String, Object> body = Map.of("candidates", List.of());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        GeminiService service = new GeminiService(properties("test-key"), restTemplate);
        HealthAssistantResponse response =
            service.generateHealthResponse("Is this normal?", null, List.of());

        assertTrue(response.isFallback());
    }

    @Test
    void clinicalNotesServeFallbackWhenUpstreamFails() {
        GeminiService service = new GeminiService(properties("test-key"), failingRestTemplate());

        ClinicalNotesResponse response = service.generateClinicalNotes(
            new ClinicalNotesRequest("John Doe", 35, "fever", "Temp 101F", null));

        assertTrue(response.isFallback());
        assertTrue(response.notesText().contains("subjective"));
        assertTrue(response.notesText().contains("John Doe"));
    }

    @Test
    void unconfiguredServiceReturnsFallbackWithoutCallingUpstream() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        GeminiService service = new GeminiService(properties("  "), restTemplate);

        HealthAssistantResponse response =
            service.generateHealthResponse("flu symptoms", null, List.of());

        assertTrue(response.isFallback());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void configuredServiceIsReportedAsConfigured() {
        assertTrue(new GeminiService(properties("k"), mock(RestTemplate.class)).isConfigured());
        assertFalse(new GeminiService(properties(""), mock(RestTemplate.class)).isConfigured());
    }
}
