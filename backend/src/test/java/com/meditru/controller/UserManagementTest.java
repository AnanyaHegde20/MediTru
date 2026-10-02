package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.dto.LoginRequest;
import com.meditru.entity.User;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String patientToken;
    private Long patientId;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        User admin = new User("Admin User", "admin@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.admin);
        User patient = new User("Plain Patient", "plain@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.patient);
        userRepository.save(admin);
        patient = userRepository.save(patient);
        adminToken = jwtService.generateToken(admin);
        patientToken = jwtService.generateToken(patient);
        patientId = patient.getId();
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
    void usersListRequiresAdmin() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email == 'admin@test.com')]").exists());
    }

    @Test
    void adminCreatesDoctorAccountThatCanSignIn() throws Exception {
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Dr. New Hire",
                                "email", "newhire@test.com",
                                "password", "secret123",
                                "role", "doctor"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newhire@test.com"))
                .andExpect(jsonPath("$.role").value("doctor"));

        String token = login("newhire@test.com", "secret123");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("doctor"));
    }

    @Test
    void createUserRejectsDuplicateEmail() throws Exception {
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Dup",
                                "email", "plain@test.com",
                                "password", "secret123",
                                "role", "patient"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminUpdatesUserRole() throws Exception {
        mockMvc.perform(put("/api/users/" + patientId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "doctor"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("doctor"));

        String token = login("plain@test.com", "secret123");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("doctor"));
    }

    @Test
    void adminDeletesUser() throws Exception {
        mockMvc.perform(delete("/api/users/" + patientId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("plain@test.com", "secret123"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteRequiresAdmin() throws Exception {
        mockMvc.perform(delete("/api/users/" + patientId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminResetsUserPasswordAndRevokesExistingSessions() throws Exception {
        mockMvc.perform(post("/api/users/" + patientId + "/reset-password")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "NewPass99!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset"));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isUnauthorized());

        String token = login("plain@test.com", "NewPass99!");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("plain@test.com", "secret123"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void resetPasswordRequiresAdmin() throws Exception {
        mockMvc.perform(post("/api/users/" + patientId + "/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "NewPass99!"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/users/" + patientId + "/reset-password")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "NewPass99!"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void resetPasswordValidatesInput() throws Exception {
        mockMvc.perform(post("/api/users/" + patientId + "/reset-password")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Password must be at least 8 characters"));

        mockMvc.perform(post("/api/users/999999/reset-password")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "NewPass99!"))))
                .andExpect(status().isNotFound());
    }
}
