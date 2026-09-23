package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.entity.Prescription;
import com.meditru.entity.User;
import com.meditru.repository.PrescriptionRepository;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PrescriptionWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private JwtService jwtService;

    private String patientToken;
    private String otherPatientToken;
    private String doctorToken;
    private Long prescriptionId;

    @BeforeEach
    void setUp() {
        prescriptionRepository.deleteAll();
        userRepository.deleteAll();

        User patient = userRepository.save(
                new User("Pat Patient", "pat-rx@example.com", "x", User.UserRole.patient));
        User other = userRepository.save(
                new User("Other Patient", "other-rx@example.com", "x", User.UserRole.patient));
        User doctor = userRepository.save(
                new User("Doc Doctor", "doc-rx@example.com", "x", User.UserRole.doctor));

        patientToken = jwtService.generateToken(patient);
        otherPatientToken = jwtService.generateToken(other);
        doctorToken = jwtService.generateToken(doctor);

        prescriptionId = prescriptionRepository
                .save(newRx(String.valueOf(patient.getId()), "Active", 2)).getId();
    }

    private Prescription newRx(String patientId, String status, int refillsRemaining) {
        Prescription rx = new Prescription(patientId, "Atorvastatin");
        rx.setDosage("20 mg");
        rx.setFrequency("Once daily");
        rx.setDoctorName("Dr. Stone");
        rx.setStatus(status);
        rx.setRefillsRemaining(refillsRemaining);
        rx.setTotalRefills(4);
        return rx;
    }

    private ResultActions requestRefill(String token) throws Exception {
        return mockMvc.perform(post("/api/prescriptions/" + prescriptionId + "/refill")
                .header("Authorization", "Bearer " + token));
    }

    private ResultActions doctorPut(String token, Map<String, Object> body) throws Exception {
        return mockMvc.perform(put("/api/prescriptions/" + prescriptionId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    @Test
    void patientRequestsRefill() throws Exception {
        requestRefill(patientToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Refill Requested"));
    }

    @Test
    void refillRequiresOwnership() throws Exception {
        requestRefill(otherPatientToken)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("You can only request a refill for your own prescription"));
    }

    @Test
    void refillRequiresPatientRole() throws Exception {
        requestRefill(doctorToken)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only patients can request refills"));
    }

    @Test
    void cannotRequestTwiceWhilePending() throws Exception {
        requestRefill(patientToken).andExpect(status().isOk());
        requestRefill(patientToken)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only active prescriptions can be refilled"));
    }

    @Test
    void refillRejectedWhenNoRefillsLeft() throws Exception {
        Prescription zero = newRx(
                String.valueOf(userRepository.findByEmail("pat-rx@example.com").orElseThrow().getId()),
                "Active", 0);
        prescriptionRepository.deleteAll();
        prescriptionId = prescriptionRepository.save(zero).getId();

        requestRefill(patientToken)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No refills remaining"));
    }

    @Test
    void doctorApprovesRefillAndDecrementsCounter() throws Exception {
        requestRefill(patientToken).andExpect(status().isOk());

        doctorPut(doctorToken, Map.of("status", "Active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Active"))
                .andExpect(jsonPath("$.refillsRemaining").value(1));
    }

    @Test
    void approvalFailsWhenNoRefillsRemaining() throws Exception {
        Prescription rx = prescriptionRepository.findById(prescriptionId).orElseThrow();
        rx.setStatus("Refill Requested");
        rx.setRefillsRemaining(0);
        prescriptionRepository.save(rx);

        doctorPut(doctorToken, Map.of("status", "Active"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No refills remaining"));
    }

    @Test
    void rejectsUnknownPrescriptionStatus() throws Exception {
        doctorPut(doctorToken, Map.of("status", "On Fire"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unknown prescription status: On Fire"));
    }

    @Test
    void rejectsInvalidPrescriptionTransition() throws Exception {
        Prescription rx = prescriptionRepository.findById(prescriptionId).orElseThrow();
        rx.setStatus("Expired");
        prescriptionRepository.save(rx);

        doctorPut(doctorToken, Map.of("status", "Active"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Invalid status change from 'Expired' to 'Active'"));
    }

    @Test
    void patientCannotCreatePrescription() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "patientId", "1",
                "medicationName", "Ibuprofen",
                "status", "Active"));

        mockMvc.perform(post("/api/prescriptions")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void patientCannotApproveRefillViaPut() throws Exception {
        requestRefill(patientToken).andExpect(status().isOk());

        doctorPut(patientToken, Map.of("status", "Active"))
                .andExpect(status().isForbidden());
    }

    @Test
    void doctorCreateRejectsUnknownStatus() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "patientId", "1",
                "medicationName", "Ibuprofen",
                "status", "On Fire"));

        mockMvc.perform(post("/api/prescriptions")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unknown prescription status: On Fire"));
    }

    @Test
    void anonymousRefillIsRejected() throws Exception {
        mockMvc.perform(post("/api/prescriptions/" + prescriptionId + "/refill"))
                .andExpect(status().isUnauthorized());
    }
}
