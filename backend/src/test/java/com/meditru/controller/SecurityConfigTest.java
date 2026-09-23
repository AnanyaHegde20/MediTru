package com.meditru.controller;

import com.meditru.entity.User;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String token;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        User user = new User("Sec Test", "security@test.com",
                "{bcrypt}$2a$not-used-in-this-test", User.UserRole.doctor);
        userRepository.save(user);
        token = jwtService.generateToken(user);
    }

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointRejectsAnonymous() throws Exception {
        mockMvc.perform(get("/api/doctors"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointAcceptsValidToken() throws Exception {
        mockMvc.perform(get("/api/doctors").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointRejectsGarbageToken() throws Exception {
        mockMvc.perform(get("/api/doctors").header("Authorization", "Bearer not.a.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authLoginIsPublic() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
