package com.meditru.dto;

import java.util.List;

public record AuthUser(
        String id,
        String name,
        String email,
        String role,
        String avatar,
        String badge,
        Integer age,
        String gender,
        String bloodGroup,
        String phone,
        List<String> allergies,
        String medicalCondition
) {}
