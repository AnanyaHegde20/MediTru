package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.entity.Appointment;
import com.meditru.entity.LabReport;
import com.meditru.entity.Prescription;
import com.meditru.entity.User;
import com.meditru.repository.AppointmentRepository;
import com.meditru.repository.LabReportRepository;
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

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RecordOwnershipTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LabReportRepository labReportRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private JwtService jwtService;

    private String patientToken;
    private String otherPatientToken;
    private String doctorToken;
    private String adminToken;
    private String patientId;
    private Long ownReportId;
    private Long otherReportId;
    private Long ownPrescriptionId;
    private Long otherPrescriptionId;
    private Long ownAppointmentId;
    private Long otherAppointmentId;

    @BeforeEach
    void setUp() {
        labReportRepository.deleteAll();
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        userRepository.deleteAll();

        User patient = userRepository.save(
                new User("Pat Patient", "pat-own@example.com", "x", User.UserRole.patient));
        User other = userRepository.save(
                new User("Other Patient", "other-own@example.com", "x", User.UserRole.patient));
        User doctor = userRepository.save(
                new User("Doc Doctor", "doc-own@example.com", "x", User.UserRole.doctor));
        User admin = userRepository.save(
                new User("Adm Admin", "adm-own@example.com", "x", User.UserRole.admin));

        patientToken = jwtService.generateToken(patient);
        otherPatientToken = jwtService.generateToken(other);
        doctorToken = jwtService.generateToken(doctor);
        adminToken = jwtService.generateToken(admin);
        patientId = String.valueOf(patient.getId());
        String otherId = String.valueOf(other.getId());

        LabReport ownReport = labReportRepository.save(new LabReport(patientId, "Own Panel", "Lipid"));
        LabReport otherReport = labReportRepository.save(new LabReport(otherId, "Secret Panel", "Lipid"));
        ownReportId = ownReport.getId();
        otherReportId = otherReport.getId();

        Prescription ownRx = prescriptionRepository.save(new Prescription(patientId, "OwnMed"));
        Prescription otherRx = prescriptionRepository.save(new Prescription(otherId, "SecretMed"));
        ownPrescriptionId = ownRx.getId();
        otherPrescriptionId = otherRx.getId();

        ownAppointmentId = appointmentRepository.save(newAppointment(patientId)).getId();
        otherAppointmentId = appointmentRepository.save(newAppointment(otherId)).getId();
    }

    private Appointment newAppointment(String ownerPatientId) {
        Appointment apt = new Appointment();
        apt.setPatientId(ownerPatientId);
        apt.setPatientName("Someone");
        apt.setDoctorId("1");
        apt.setDoctorName("Dr. Stone");
        apt.setSpecialty("Cardiology");
        apt.setDate("Oct 24, 2026");
        apt.setTime("10:00 AM");
        apt.setStatus("Pending");
        apt.setType("Checkup");
        return apt;
    }

    @Test
    void patientSeesOnlyOwnLabReports() throws Exception {
        mockMvc.perform(get("/api/lab-reports")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].patientId").value(patientId));
    }

    @Test
    void patientCannotReadOthersLabReportById() throws Exception {
        mockMvc.perform(get("/api/lab-reports/" + otherReportId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void patientReadsOwnLabReportById() throws Exception {
        mockMvc.perform(get("/api/lab-reports/" + ownReportId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value(patientId));
    }

    @Test
    void patientSeesOnlyOwnPrescriptions() throws Exception {
        mockMvc.perform(get("/api/prescriptions")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].patientId").value(patientId));
    }

    @Test
    void patientCannotReadOthersPrescriptionById() throws Exception {
        mockMvc.perform(get("/api/prescriptions/" + otherPrescriptionId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void patientSeesOnlyOwnAppointments() throws Exception {
        mockMvc.perform(get("/api/appointments")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].patientId").value(patientId));
    }

    @Test
    void patientCannotReadOthersAppointmentById() throws Exception {
        mockMvc.perform(get("/api/appointments/" + otherAppointmentId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void patientExplicitOtherPatientIdParamStillYieldsOwnData() throws Exception {
        mockMvc.perform(get("/api/lab-reports?patientId=999")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].patientId").value(patientId));
    }

    @Test
    void doctorSeesAllLabReports() throws Exception {
        mockMvc.perform(get("/api/lab-reports")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void adminSeesAllAppointments() throws Exception {
        mockMvc.perform(get("/api/appointments")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void patientCannotCreateReportForSomeoneElse() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "patientId", "999",
                "name", "Forged Panel",
                "category", "Lipid"));

        mockMvc.perform(post("/api/lab-reports")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You can only create reports for yourself"));
    }

    @Test
    void anonymousListIsRejected() throws Exception {
        mockMvc.perform(get("/api/lab-reports"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void patientQueueIsBlockedForPatients() throws Exception {
        mockMvc.perform(get("/api/patient-queue")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void patientQueueIsReadableByDoctor() throws Exception {
        mockMvc.perform(get("/api/patient-queue")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk());
    }

    @Test
    void selfRegistrationRejectsDoctorRole() throws Exception {
        var body = objectMapper.writeValueAsString(Map.of(
                "name", "Rogue Doctor", "email", "rogue-doc@example.com",
                "password", "secret123", "role", "doctor"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Only patients can self-register; doctor and admin accounts are created by an administrator"));
    }

    @Test
    void selfRegistrationRejectsAdminRole() throws Exception {
        var body = objectMapper.writeValueAsString(Map.of(
                "name", "Rogue Admin", "email", "rogue-admin@example.com",
                "password", "secret123", "role", "admin"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void selfRegistrationDefaultsToPatientWhenRoleOmitted() throws Exception {
        var body = objectMapper.writeValueAsString(Map.of(
                "name", "Plain User", "email", "plain-user@example.com",
                "password", "secret123"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("patient"));
    }
}
