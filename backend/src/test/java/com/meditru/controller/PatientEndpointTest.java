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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PatientEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String patientEmail;
    private String doctorToken;
    private String adminToken;
    private String patientToken;

    @BeforeEach
    void setUp() {
        String run = UUID.randomUUID().toString().substring(0, 8);

        User patient = new User("Patient " + run, "patient-" + run + "@test.com",
                "{bcrypt}$2a$not-used-in-this-test", User.UserRole.patient);
        patient.setMedicalCondition("Stage 1 Hypertension");
        userRepository.save(patient);
        patientEmail = patient.getEmail();

        User doctor = new User("Doctor " + run, "doctor-" + run + "@test.com",
                "{bcrypt}$2a$not-used-in-this-test", User.UserRole.doctor);
        userRepository.save(doctor);
        doctorToken = jwtService.generateToken(doctor);

        User admin = new User("Admin " + run, "admin-" + run + "@test.com",
                "{bcrypt}$2a$not-used-in-this-test", User.UserRole.admin);
        userRepository.save(admin);
        adminToken = jwtService.generateToken(admin);

        patientToken = jwtService.generateToken(patient);
    }

    @Test
    void doctorCanListPatients() throws Exception {
        mockMvc.perform(get("/api/patients").header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email == '" + patientEmail + "')]").exists());
    }

    @Test
    void adminCanListPatients() throws Exception {
        mockMvc.perform(get("/api/patients").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email == '" + patientEmail + "')]").exists());
    }

    @Test
    void patientRoleIsForbidden() throws Exception {
        mockMvc.perform(get("/api/patients").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void responseContainsOnlyPatientsAndNoPasswords() throws Exception {
        mockMvc.perform(get("/api/patients").header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.role == 'doctor')]").doesNotExist())
                .andExpect(jsonPath("$[?(@.password)]").doesNotExist())
                .andExpect(jsonPath("$[?(@.email == '" + patientEmail + "')].medicalCondition")
                        .value("Stage 1 Hypertension"));
    }
}
