package com.meditru.controller;

import com.meditru.dto.HealthCheckResponse;
import com.meditru.service.GeminiService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final GeminiService geminiService;
    private final JdbcTemplate jdbcTemplate;

    public HealthController(GeminiService geminiService, JdbcTemplate jdbcTemplate) {
        this.geminiService = geminiService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public HealthCheckResponse healthCheck() {
        String database;
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            database = "up";
        } catch (Exception e) {
            database = "down";
        }
        return HealthCheckResponse.ok(geminiService.isConfigured(), database);
    }
}
