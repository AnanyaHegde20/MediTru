package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.dto.LoginRequest;
import com.meditru.entity.User;
import com.meditru.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AccountSettingsTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        User user = new User("Test Patient", "patient@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.patient);
        userRepository.save(user);
        token = login("patient@test.com", "secret123");
    }

    private String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    @Test
    void updateProfileUpdatesOwnDetails() throws Exception {
        Map<String, Object> patch = Map.of(
                "name", "Renamed Patient",
                "phone", "555-0100",
                "age", 31,
                "gender", "Female",
                "bloodGroup", "O+",
                "allergies", java.util.List.of("Penicillin", "Peanuts"),
                "medicalCondition", "Asthma"
        );

        mockMvc.perform(put("/api/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Patient"))
                .andExpect(jsonPath("$.phone").value("555-0100"))
                .andExpect(jsonPath("$.age").value(31))
                .andExpect(jsonPath("$.allergies[0]").value("Penicillin"));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Patient"))
                .andExpect(jsonPath("$.medicalCondition").value("Asthma"));
    }

    @Test
    void updateProfileIgnoresPrivilegedFields() throws Exception {
        Map<String, Object> patch = Map.of(
                "name", "Sneaky Patient",
                "role", "admin",
                "email", "hax@test.com",
                "password", "hacked-password"
        );

        mockMvc.perform(put("/api/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sneaky Patient"))
                .andExpect(jsonPath("$.role").value("patient"))
                .andExpect(jsonPath("$.email").value("patient@test.com"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("patient@test.com", "secret123"))))
                .andExpect(status().isOk());
    }

    @Test
    void updateProfileRejectsBlankName() throws Exception {
        mockMvc.perform(put("/api/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "  "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Name cannot be empty"));
    }

    @Test
    void profileUpdateRequiresToken() throws Exception {
        mockMvc.perform(put("/api/auth/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "No Token"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePasswordSucceedsAndRotatesLogin() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("currentPassword", "secret123", "newPassword", "brandNewPass9"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password updated"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("patient@test.com", "brandNewPass9"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("patient@test.com", "secret123"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("currentPassword", "not-my-password", "newPassword", "brandNewPass9"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Current password is incorrect"));
    }

    @Test
    void changePasswordRejectsShortNewPassword() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("currentPassword", "secret123", "newPassword", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("New password must be at least 8 characters"));
    }

    @Test
    void changePasswordRejectsSamePassword() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("currentPassword", "secret123", "newPassword", "secret123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("New password must differ from the current password"));
    }

    @Test
    void changePasswordRequiresToken() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("currentPassword", "secret123", "newPassword", "brandNewPass9"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usersUpdateRequiresAdmin() throws Exception {
        mockMvc.perform(put("/api/users/1")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "Role Hack"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "No Token"))))
                .andExpect(status().isUnauthorized());
    }
}
