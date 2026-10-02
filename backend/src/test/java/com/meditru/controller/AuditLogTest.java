package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.dto.LoginRequest;
import com.meditru.entity.Appointment;
import com.meditru.entity.User;
import com.meditru.repository.AppointmentRepository;
import com.meditru.repository.AuditLogRepository;
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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuditLogTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String patientToken;
    private Long patientId;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        appointmentRepository.deleteAll();
        userRepository.deleteAll();

        User admin = userRepository.save(new User("Admin User", "admin@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.admin));
        User patient = userRepository.save(new User("Plain Patient", "patient@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.patient));
        patientId = patient.getId();
        adminToken = jwtService.generateToken(admin);
        patientToken = jwtService.generateToken(patient);
    }

    @Test
    void auditLogEndpointRequiresAdmin() throws Exception {
        mockMvc.perform(get("/api/audit-log"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/audit-log").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/audit-log").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void loginSuccessAndFailureAreAudited() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("admin@test.com", "wrong-password"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/audit-log?action=LOGIN_FAILED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("LOGIN_FAILED"))
                .andExpect(jsonPath("$[0].actorEmail").value("admin@test.com"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("admin@test.com", "secret123"))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/audit-log?action=LOGIN_SUCCESS")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("LOGIN_SUCCESS"))
                .andExpect(jsonPath("$[0].actorRole").value("admin"));
    }

    @Test
    void userMutationsAreAudited() throws Exception {
        String body = mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "New Hire",
                                "email", "newhire@test.com",
                                "password", "secret123",
                                "role", "patient"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long newUserId = objectMapper.readTree(body).get("id").asLong();

        mockMvc.perform(get("/api/audit-log?action=USER_CREATED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$[0].action").value("USER_CREATED"))
                .andExpect(jsonPath("$[0].targetId").value(String.valueOf(newUserId)))
                .andExpect(jsonPath("$[0].detail").value("patient account for newhire@test.com"));

        mockMvc.perform(put("/api/users/" + newUserId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "doctor"))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/audit-log?action=ROLE_CHANGED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$[0].action").value("ROLE_CHANGED"))
                .andExpect(jsonPath("$[0].detail").value("patient → doctor (newhire@test.com)"));

        mockMvc.perform(post("/api/users/" + newUserId + "/reset-password")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "FreshPass99"))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/audit-log?action=PASSWORD_RESET")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$[0].action").value("PASSWORD_RESET"));

        mockMvc.perform(delete("/api/users/" + newUserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/audit-log?action=USER_DELETED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$[0].action").value("USER_DELETED"))
                .andExpect(jsonPath("$[0].actorEmail").value("admin@test.com"));
    }

    @Test
    void appointmentStatusChangeIsAudited() throws Exception {
        Appointment apt = new Appointment();
        apt.setPatientId(String.valueOf(patientId));
        apt.setPatientName("Plain Patient");
        apt.setDoctorId("d1");
        apt.setDoctorName("Dr. Test");
        apt.setSpecialty("Cardiology");
        apt.setDate("2026-04-01");
        apt.setTime("09:00");
        apt.setStatus("Pending");
        apt.setType("In-person");
        apt = appointmentRepository.save(apt);

        mockMvc.perform(put("/api/appointments/" + apt.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "Cancelled"))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/audit-log?action=APPOINTMENT_STATUS_CHANGED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$[0].action").value("APPOINTMENT_STATUS_CHANGED"))
                .andExpect(jsonPath("$[0].detail").value("Pending → Cancelled"))
                .andExpect(jsonPath("$[0].actorRole").value("admin"));
    }

    @Test
    void auditLogSupportsPagingAndActionFilter() throws Exception {
        for (int i = 0; i < 12; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    new LoginRequest("admin@test.com", "nope" + i))))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(get("/api/audit-log?page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(10)))
                .andExpect(jsonPath("$.totalElements").value(12))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.hasNext").value(true));

        mockMvc.perform(get("/api/audit-log?page=1&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.hasPrevious").value(true));

        mockMvc.perform(get("/api/audit-log?action=LOGIN_FAILED&page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$.totalElements").value(12));

        mockMvc.perform(get("/api/audit-log?action=NO_SUCH_ACTION")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
