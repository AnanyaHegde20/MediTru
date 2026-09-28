package com.meditru.dto;

public record CreateThreadRequest(
        String partnerName,
        String partnerRoleLabel,
        String partnerAvatar,
        String subject
) {}
