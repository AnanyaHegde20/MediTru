package com.meditru.dto;

public record ChangePasswordRequest(
        String currentPassword,
        String newPassword
) {}
