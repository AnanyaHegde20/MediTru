package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.entity.Doctor;
import com.meditru.entity.User;
import com.meditru.repository.DoctorRepository;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureMockMvc
class DoctorEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private JwtService jwtService;

    private String patientToken;
    private String doctorToken;
    private String otherDoctorToken;
    private String adminToken;
    private Long ownDoctorId;
    private Long otherDoctorId;
    private Long unlinkedDoctorId;

    @BeforeEach
    void setUp() {
        doctorRepository.deleteAll();
        userRepository.deleteAll();

        User patient = userRepository.save(
                new User("Pat Patient", "pat-avail@example.com", "x", User.UserRole.patient));
        User doctor = userRepository.save(
                new User("Doc Own", "doc-avail@example.com", "x", User.UserRole.doctor));
        User otherDoctor = userRepository.save(
                new User("Doc Other", "doc-other@example.com", "x", User.UserRole.doctor));
        User admin = userRepository.save(
                new User("Ada Admin", "admin-avail@example.com", "x", User.UserRole.admin));

        patientToken = jwtService.generateToken(patient);
        doctorToken = jwtService.generateToken(doctor);
        otherDoctorToken = jwtService.generateToken(otherDoctor);
        adminToken = jwtService.generateToken(admin);

        ownDoctorId = saveDoctor("Dr. Own", "doc-avail@example.com");
        otherDoctorId = saveDoctor("Dr. Other", "doc-other@example.com");
        unlinkedDoctorId = saveDoctor("Dr. Unlinked", null);
    }

    private Long saveDoctor(String name, String email) {
        Doctor doc = new Doctor(name, "Cardiology", new BigDecimal("4.8"), 10, 5, new BigDecimal("100"));
        doc.setEmail(email);
        doc.setSlotsJson("{\"morning\":[\"09:00 AM\"],\"afternoon\":[],\"evening\":[]}");
        return doctorRepository.save(doc).getId();
    }

    private String slots(String value) throws Exception {
        return objectMapper.writeValueAsString(Map.of("slotsJson", value));
    }

    private String newSlotsJson() {
        return "{\"morning\":[\"09:00 AM\"],\"afternoon\":[\"02:30 PM\"],\"evening\":[\"07:47 PM\"]}";
    }

    @Test
    void doctorUpdatesOwnAvailability() throws Exception {
        mockMvc.perform(put("/api/doctors/" + ownDoctorId)
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(slots(newSlotsJson())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slotsJson").value(newSlotsJson()));

        mockMvc.perform(get("/api/doctors/" + ownDoctorId)
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slotsJson").value(newSlotsJson()));
    }

    @Test
    void doctorCannotUpdateSomeoneElsesAvailability() throws Exception {
        mockMvc.perform(put("/api/doctors/" + otherDoctorId)
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(slots(newSlotsJson())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You can only edit your own availability"));
    }

    @Test
    void doctorCannotUpdateUnlinkedProfile() throws Exception {
        mockMvc.perform(put("/api/doctors/" + unlinkedDoctorId)
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(slots(newSlotsJson())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You can only edit your own availability"));
    }

    @Test
    void adminCanUpdateAnyAvailability() throws Exception {
        mockMvc.perform(put("/api/doctors/" + otherDoctorId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(slots(newSlotsJson())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slotsJson").value(newSlotsJson()));
    }

    @Test
    void patientCannotUpdateAvailability() throws Exception {
        mockMvc.perform(put("/api/doctors/" + ownDoctorId)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(slots(newSlotsJson())))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousUpdateIsRejected() throws Exception {
        mockMvc.perform(put("/api/doctors/" + ownDoctorId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(slots(newSlotsJson())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsOversizeAvailability() throws Exception {
        String big = "x".repeat(2001);
        mockMvc.perform(put("/api/doctors/" + ownDoctorId)
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(slots(big)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Availability data too large"));
    }

    @Test
    void doctorCreatesOwnProfile() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "Dr. New Profile",
                "email", "new-profile@example.com",
                "specialty", "Neurology",
                "slotsJson", newSlotsJson()));

        mockMvc.perform(post("/api/doctors")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Dr. New Profile"))
                .andExpect(jsonPath("$.email").value("new-profile@example.com"))
                .andExpect(jsonPath("$.slotsJson").value(newSlotsJson()));
    }

    @Test
    void createRequiresName() throws Exception {
        mockMvc.perform(post("/api/doctors")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("specialty", "Neurology"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Doctor name is required"));
    }

    @Test
    void createRequiresSpecialty() throws Exception {
        mockMvc.perform(post("/api/doctors")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "Dr. No Spec"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Specialty is required"));
    }

    @Test
    void adminDeletesDoctorProfile() throws Exception {
        mockMvc.perform(delete("/api/doctors/" + otherDoctorId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertFalse(doctorRepository.existsById(otherDoctorId));
        assertTrue(doctorRepository.existsById(ownDoctorId));
    }

    @Test
    void doctorCannotDeleteProfiles() throws Exception {
        mockMvc.perform(delete("/api/doctors/" + otherDoctorId)
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden());

        assertTrue(doctorRepository.existsById(otherDoctorId));
    }

    @Test
    void deletingUnknownDoctorReturnsNotFound() throws Exception {
        mockMvc.perform(delete("/api/doctors/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }
}
