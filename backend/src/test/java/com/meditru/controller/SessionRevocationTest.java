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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SessionRevocationTest {

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

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        userRepository.save(new User("Revocation Patient", "revocation@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.patient));
        token = login("secret123");
    }

    private String login(String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("revocation@test.com", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    @Test
    void logoutRevokesTheOutstandingToken() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out"));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());

        String freshToken = login("secret123");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + freshToken))
                .andExpect(status().isOk());
    }

    @Test
    void logoutRequiresAnAuthenticatedSession() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePasswordRevokesThePreviousToken() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("currentPassword", "secret123", "newPassword", "brandNewPass9"))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());

        String freshToken = login("brandNewPass9");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + freshToken))
                .andExpect(status().isOk());
    }

    @Test
    void tokensOfDeletedUsersAreRejected() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        userRepository.deleteAll();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void revokedTokenIsRejectedEvenWithTheSameSignature() throws Exception {
        String beforeLogout = login("secret123");
        String otherSession = login("secret123");

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + beforeLogout))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + beforeLogout))
                .andExpect(status().isUnauthorized());

        // A separate session issued before the logout is revoked too (whole-account revocation)
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + otherSession))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void generatedTokensCarryTheTokenVersionClaim() throws Exception {
        User user = userRepository.findByEmail("revocation@test.com").orElseThrow();
        String generated = jwtService.generateToken(user);
        org.junit.jupiter.api.Assertions.assertEquals(0L, jwtService.extractTokenVersion(generated));
    }
}
