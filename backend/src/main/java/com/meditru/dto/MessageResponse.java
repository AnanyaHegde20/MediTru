package com.meditru.dto;

public record MessageResponse(
        String id,
        String senderId,
        String senderName,
        String text,
        long createdAt
) {}
