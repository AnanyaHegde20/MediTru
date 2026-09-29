package com.meditru.dto;

import java.util.List;

public record UpdateProfileRequest(
        String name,
        String phone,
        String avatar,
        String badge,
        Integer age,
        String gender,
        String bloodGroup,
        List<String> allergies,
        String medicalCondition
) {}
