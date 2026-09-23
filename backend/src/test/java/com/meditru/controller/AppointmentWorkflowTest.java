package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.entity.Appointment;
import com.meditru.entity.User;
import com.meditru.repository.AppointmentRepository;
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
class AppointmentWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private JwtService jwtService;

    private String patientToken;
    private String doctorToken;
    private String adminToken;
    private String otherPatientToken;
    private Long appointmentId;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        userRepository.deleteAll();

        User patient = userRepository.save(
                new User("Pat Patient", "pat-wf@example.com", "x", User.UserRole.patient));
        User other = userRepository.save(
                new User("Other Patient", "other-wf@example.com", "x", User.UserRole.patient));
        User doctor = userRepository.save(
                new User("Doc Doctor", "doc-wf@example.com", "x", User.UserRole.doctor));
        User admin = userRepository.save(
                new User("Adm Admin", "adm-wf@example.com", "x", User.UserRole.admin));

        patientToken = jwtService.generateToken(patient);
        otherPatientToken = jwtService.generateToken(other);
        doctorToken = jwtService.generateToken(doctor);
        adminToken = jwtService.generateToken(admin);

        appointmentId = appointmentRepository.save(newPendingAppointment(
                String.valueOf(patient.getId()), "Pat Patient")).getId();
    }

    private Appointment newPendingAppointment(String patientId, String patientName) {
        Appointment apt = new Appointment();
        apt.setPatientId(patientId);
        apt.setPatientName(patientName);
        apt.setDoctorId("1");
        apt.setDoctorName("Dr. Stone");
        apt.setSpecialty("Cardiology");
        apt.setDate("Oct 24, 2026");
        apt.setTime("10:00 AM");
        apt.setStatus("Pending");
        apt.setType("Checkup");
        return apt;
    }

    private ResultActions putStatus(String token, String status) throws Exception {
        return mockMvc.perform(put("/api/appointments/" + appointmentId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", status))));
    }

    private void setStatusDirectly(String status) {
        Appointment apt = appointmentRepository.findById(appointmentId).orElseThrow();
        apt.setStatus(status);
        appointmentRepository.save(apt);
    }

    @Test
    void doctorConfirmsPendingAppointment() throws Exception {
        putStatus(doctorToken, "Confirmed")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Confirmed"));
    }

    @Test
    void doctorRunsFullVisitFlow() throws Exception {
        putStatus(doctorToken, "Confirmed").andExpect(status().isOk());
        putStatus(doctorToken, "In Progress").andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("In Progress"));
        putStatus(doctorToken, "Completed").andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Completed"));
    }

    @Test
    void adminCanConfirmAppointment() throws Exception {
        putStatus(adminToken, "Confirmed")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Confirmed"));
    }

    @Test
    void rejectsUnknownStatus() throws Exception {
        putStatus(doctorToken, "Banana")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unknown appointment status: Banana"));
    }

    @Test
    void rejectsInvalidTransition() throws Exception {
        setStatusDirectly("Completed");
        putStatus(doctorToken, "Confirmed")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Invalid status change from 'Completed' to 'Confirmed'"));
    }

    @Test
    void rejectsSkipFromPendingToInProgress() throws Exception {
        putStatus(doctorToken, "In Progress").andExpect(status().isBadRequest());
    }

    @Test
    void patientCancelsOwnPendingAppointment() throws Exception {
        putStatus(patientToken, "Cancelled")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Cancelled"));
    }

    @Test
    void patientCannotConfirmOwnAppointment() throws Exception {
        putStatus(patientToken, "Confirmed")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Only a doctor or admin can set status to 'Confirmed'"));
    }

    @Test
    void patientCannotUpdateSomeoneElsesAppointment() throws Exception {
        appointmentRepository.save(newPendingAppointment("999", "Stranger"));

        Long otherId = appointmentRepository.findAll().stream()
                .filter(a -> "999".equals(a.getPatientId()))
                .findFirst().orElseThrow().getId();

        mockMvc.perform(put("/api/appointments/" + otherId)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "Cancelled"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("You are not allowed to update this appointment"));
    }

    @Test
    void anonymousUpdateIsRejected() throws Exception {
        mockMvc.perform(put("/api/appointments/" + appointmentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "Cancelled"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createRejectsUnknownStartStatus() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "patientId", "1",
                "patientName", "Pat",
                "doctorId", "2",
                "doctorName", "Dr. Stone",
                "date", "Oct 24, 2026",
                "time", "10:00 AM",
                "status", "Scheduled"));

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("New appointments must start as Pending or Confirmed"));
    }

    @Test
    void createDefaultsToPending() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "patientId", "1",
                "patientName", "Pat",
                "doctorId", "2",
                "doctorName", "Dr. Stone",
                "date", "Oct 24, 2026",
                "time", "10:00 AM"));

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Pending"));
    }

    @Test
    void patientCanEditOwnAppointmentNotes() throws Exception {
        mockMvc.perform(put("/api/appointments/" + appointmentId)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "Pending", "notes", "Updated notes"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Updated notes"));
    }
}
