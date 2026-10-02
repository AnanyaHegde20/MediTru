package com.meditru.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.entity.Appointment;
import com.meditru.entity.Doctor;
import com.meditru.entity.LabReport;
import com.meditru.entity.User;
import com.meditru.repository.AppointmentRepository;
import com.meditru.repository.DoctorRepository;
import com.meditru.repository.LabReportRepository;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private LabReportRepository labReportRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String patientToken;
    private String doctorToken;
    private String adminToken;
    private Long patientId;
    private Long otherPatientId;

    @BeforeEach
    void setUp() {
        labReportRepository.deleteAll();
        appointmentRepository.deleteAll();
        doctorRepository.deleteAll();
        userRepository.deleteAll();

        User patient = userRepository.save(
                new User("Pat Findme", "pat.findme@example.com", "x", User.UserRole.patient));
        User other = userRepository.save(
                new User("Zed Findme", "zed.findme@example.com", "x", User.UserRole.patient));
        User doctor = userRepository.save(
                new User("Doc Findme", "doc.findme@example.com", "x", User.UserRole.doctor));
        User admin = userRepository.save(
                new User("Adm Findme", "adm.findme@example.com", "x", User.UserRole.admin));

        patientToken = jwtService.generateToken(patient);
        doctorToken = jwtService.generateToken(doctor);
        adminToken = jwtService.generateToken(admin);
        patientId = patient.getId();
        otherPatientId = other.getId();

        Doctor directoryDoctor = new Doctor();
        directoryDoctor.setName("Dr. Findme Cardiology");
        directoryDoctor.setSpecialty("Cardiology");
        directoryDoctor.setHospital("Findme Hospital");
        doctorRepository.save(directoryDoctor);

        appointmentRepository.save(newAppointment(
                String.valueOf(patientId), "Pat Findme", "Findme"));
        appointmentRepository.save(newAppointment(
                String.valueOf(otherPatientId), "Zed Findme", "Findme"));

        labReportRepository.save(new LabReport(String.valueOf(patientId), "Findme Panel", "Lipid"));
        labReportRepository.save(new LabReport(String.valueOf(otherPatientId), "Findme Secret Panel", "Lipid"));
    }

    private Appointment newAppointment(String ownerPatientId, String ownerName, String marker) {
        Appointment apt = new Appointment();
        apt.setPatientId(ownerPatientId);
        apt.setPatientName(ownerName);
        apt.setDoctorId("1");
        apt.setDoctorName("Dr. " + marker);
        apt.setSpecialty("Cardiology");
        apt.setDate("Jan 2, 2026");
        apt.setTime("10:00 AM");
        apt.setStatus("Pending");
        apt.setType("Checkup");
        return apt;
    }

    private JsonNode search(String token, String q) throws Exception {
        String body = mockMvc.perform(get("/api/search")
                        .param("q", q)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }

    private List<String> idsOfType(JsonNode results, String type) {
        List<String> ids = new ArrayList<>();
        for (JsonNode node : results) {
            if (type.equals(node.path("type").asText())) {
                ids.add(node.path("id").asText());
            }
        }
        return ids;
    }

    private boolean hasType(JsonNode results, String type) {
        return !idsOfType(results, type).isEmpty();
    }

    @Test
    void anonymousSearchIsRejected() throws Exception {
        mockMvc.perform(get("/api/search").param("q", "findme"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shortQueryReturnsEmptyList() throws Exception {
        JsonNode results = search(patientToken, "f");
        assertTrue(results.isArray());
        assertEquals(0, results.size());
    }

    @Test
    void patientSeesOwnRecordsAndDirectoryButNotOtherPatientsData() throws Exception {
        JsonNode results = search(patientToken, "findme");

        assertTrue(hasType(results, "doctor"));
        assertTrue(hasType(results, "appointment"));
        assertTrue(hasType(results, "lab"));
        assertFalse(hasType(results, "user"));
        assertFalse(hasType(results, "patient"));

        List<String> appointmentIds = idsOfType(results, "appointment");
        assertEquals(1, appointmentIds.size());

        List<String> labIds = idsOfType(results, "lab");
        assertEquals(1, labIds.size());
        for (String id : labIds) {
            LabReport report = labReportRepository.findById(Long.valueOf(id)).orElseThrow();
            assertFalse(String.valueOf(otherPatientId).equals(report.getPatientId()));
        }
    }

    @Test
    void patientCannotFindOtherPatientsThroughSearch() throws Exception {
        JsonNode results = search(patientToken, "zed");
        assertFalse(hasType(results, "user"));
        assertFalse(hasType(results, "patient"));
        assertTrue(idsOfType(results, "appointment").isEmpty());
        assertTrue(idsOfType(results, "lab").isEmpty());
    }

    @Test
    void doctorSeesPatientsAndAllRecords() throws Exception {
        JsonNode results = search(doctorToken, "findme");

        assertTrue(hasType(results, "patient"));
        assertTrue(hasType(results, "appointment"));
        assertTrue(hasType(results, "lab"));
        assertFalse(hasType(results, "user"));

        List<String> patientIds = idsOfType(results, "patient");
        assertTrue(patientIds.contains(String.valueOf(patientId)));
        assertTrue(patientIds.contains(String.valueOf(otherPatientId)));
    }

    @Test
    void adminSeesAccountsButNoLabResults() throws Exception {
        JsonNode results = search(adminToken, "findme");

        assertTrue(hasType(results, "user"));
        assertTrue(hasType(results, "doctor"));
        assertTrue(hasType(results, "appointment"));
        assertFalse(hasType(results, "lab"));
        assertFalse(hasType(results, "patient"));

        List<String> userIds = idsOfType(results, "user");
        assertTrue(userIds.contains(String.valueOf(patientId)));
    }

    @Test
    void resultsExposeLightweightShape() throws Exception {
        JsonNode results = search(doctorToken, "findme");
        assertTrue(results.size() > 0);
        JsonNode first = results.get(0);
        assertTrue(first.has("type"));
        assertTrue(first.has("id"));
        assertTrue(first.has("title"));
        assertTrue(first.has("subtitle"));
        assertFalse(first.has("password"));
    }
}
