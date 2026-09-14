package com.meditru.dto;

import java.util.List;

public record HealthAssistantResponse(
    String reply,
    boolean isFallback,
    List<String> suggestions
) {
    public static HealthAssistantResponse success(String reply) {
        return new HealthAssistantResponse(reply, false, null);
    }

    public static HealthAssistantResponse fallback(String reply, List<String> suggestions) {
        return new HealthAssistantResponse(reply, true, suggestions);
    }
}
