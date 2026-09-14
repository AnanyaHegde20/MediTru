package com.meditru.dto;

import java.time.Instant;

public record HealthCheckResponse(
    String status,
    String timestamp,
    boolean hasGeminiKey
) {
    public static HealthCheckResponse ok(boolean hasGeminiKey) {
        return new HealthCheckResponse("ok", Instant.now().toString(), hasGeminiKey);
    }
}
