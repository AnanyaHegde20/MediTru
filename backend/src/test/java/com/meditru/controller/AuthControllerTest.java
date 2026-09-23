package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.dto.LoginRequest;
import com.meditru.dto.RegisterRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        User user = new User("Test Patient", "patient@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.patient);
        userRepository.save(user);
    }

    @Test
    void loginSucceedsWithValidCredentials() throws Exception {
        var request = new LoginRequest("patient@test.com", "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("patient@test.com"))
                .andExpect(jsonPath("$.user.role").value("patient"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void loginFailsWithWrongPassword() throws Exception {
        var request = new LoginRequest("patient@test.com", "wrong");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void loginFailsWithUnknownEmail() throws Exception {
        var request = new LoginRequest("nobody@test.com", "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerCreatesAccountAndReturnsToken() throws Exception {
        var request = new RegisterRequest("New User", "new@test.com", "secret123", "patient");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("new@test.com"));
    }

    @Test
    void registerRejectsDuplicateEmail() throws Exception {
        var request = new RegisterRequest("Dup", "patient@test.com", "secret123", "patient");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerRejectsShortPassword() throws Exception {
        var request = new RegisterRequest("Short", "short@test.com", "123", "patient");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void meReturnsCurrentUserFromToken() throws Exception {
        var login = new LoginRequest("patient@test.com", "secret123");
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(body).get("token").asText();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("patient@test.com"));
    }

    @Test
    void meFailsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
