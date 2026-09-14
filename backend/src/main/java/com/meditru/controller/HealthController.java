package com.meditru.controller;

import com.meditru.dto.HealthCheckResponse;
import com.meditru.service.GeminiService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final GeminiService geminiService;

    public HealthController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @GetMapping("/health")
    public HealthCheckResponse healthCheck() {
        return HealthCheckResponse.ok(geminiService.isConfigured());
    }
}
