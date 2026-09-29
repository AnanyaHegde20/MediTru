package com.meditru.dto;

import java.time.Instant;

public record HealthCheckResponse(
    String status,
    String timestamp,
    boolean hasGeminiKey,
    String database
) {
    public static HealthCheckResponse ok(boolean hasGeminiKey, String database) {
        return new HealthCheckResponse("ok", Instant.now().toString(), hasGeminiKey, database);
    }
}
