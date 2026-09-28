package com.meditru.dto;

import java.util.List;

public record MessageThreadResponse(
        String id,
        String subject,
        String partnerName,
        String partnerRoleLabel,
        String partnerAvatar,
        long updatedAt,
        int unread,
        List<MessageResponse> messages
) {}
