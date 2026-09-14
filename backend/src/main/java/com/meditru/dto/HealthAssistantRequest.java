package com.meditru.dto;

import java.util.List;

public record HealthAssistantRequest(
    String message,
    List<ChatHistoryEntry> history,
    String reportContext
) {}
