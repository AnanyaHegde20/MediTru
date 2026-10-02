package com.meditru.controller;

import com.meditru.entity.Appointment;
import com.meditru.entity.LabReport;
import com.meditru.entity.User;
import com.meditru.repository.AppointmentRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PaginationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private LabReportRepository labReportRepository;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String doctorToken;
    private String patientToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        appointmentRepository.deleteAll();
        labReportRepository.deleteAll();

        List<User> users = new ArrayList<>();
        Long patientId = null;
        for (int i = 1; i <= 25; i++) {
            User.UserRole role = i == 1 ? User.UserRole.admin
                    : i == 2 ? User.UserRole.doctor
                    : User.UserRole.patient;
            String name = String.format("Page User %02d", i);
            User user = new User(name, String.format("page.user%02d@test.com", i), "encoded", role);
            user = userRepository.save(user);
            users.add(user);
            if (i == 3) patientId = user.getId();
        }
        adminToken = jwtService.generateToken(users.get(0));
        doctorToken = jwtService.generateToken(users.get(1));
        patientToken = jwtService.generateToken(users.get(2));

        List<Appointment> appointments = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            Appointment apt = new Appointment();
            apt.setPatientId(i <= 3 ? String.valueOf(patientId) : "p" + ((i - 1) / 5));
            apt.setPatientName("Page Patient " + ((i - 1) / 5));
            apt.setDoctorId("d1");
            apt.setDoctorName("Page Doctor");
            apt.setSpecialty("Cardiology");
            apt.setDate("2026-04-01");
            apt.setTime("09:00");
            apt.setStatus(i % 3 == 0 ? "Cancelled" : "Confirmed");
            apt.setType("In-person");
            appointments.add(apt);
        }
        appointmentRepository.saveAll(appointments);

        List<LabReport> reports = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            LabReport report = new LabReport(String.valueOf(patientId), "Page Report " + i, "Hematology");
            report.setStatus("Normal");
            report.setDate("2026-04-01");
            report.setDoctorName("Page Doctor");
            reports.add(report);
        }
        labReportRepository.saveAll(reports);
    }

    @Test
    void usersWithoutPageParamReturnLegacyArray() throws Exception {
        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(25));
    }

    @Test
    void usersPagingReturnsEnvelopeWithFacets() throws Exception {
        mockMvc.perform(get("/api/users?page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(10))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.hasNext").value(true))
                .andExpect(jsonPath("$.hasPrevious").value(false))
                .andExpect(jsonPath("$.facets.admin").value(1))
                .andExpect(jsonPath("$.facets.doctor").value(1))
                .andExpect(jsonPath("$.facets.patient").value(23));
    }

    @Test
    void usersPageBeyondRangeClampsToLastPage() throws Exception {
        mockMvc.perform(get("/api/users?page=99&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.items.length()").value(5))
                .andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.hasPrevious").value(true));
    }

    @Test
    void usersQueryFiltersBeforePaging() throws Exception {
        mockMvc.perform(get("/api/users?page=0&size=10&q=Page User 1")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(10))
                .andExpect(jsonPath("$.items.length()").value(10));

        mockMvc.perform(get("/api/users?q=nobody-matches-this")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(0)));
    }

    @Test
    void appointmentsPagingReturnsEnvelope() throws Exception {
        mockMvc.perform(get("/api/appointments?page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(10))
                .andExpect(jsonPath("$.totalElements").value(15))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.hasNext").value(true));

        mockMvc.perform(get("/api/appointments?page=1&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(5))
                .andExpect(jsonPath("$.hasPrevious").value(true))
                .andExpect(jsonPath("$.hasNext").value(false));
    }

    @Test
    void appointmentsStatusAndQueryFiltersApply() throws Exception {
        mockMvc.perform(get("/api/appointments?page=0&size=10&status=Cancelled")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5));

        mockMvc.perform(get("/api/appointments?page=0&size=10&q=Page Patient 2")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5));

        mockMvc.perform(get("/api/appointments?page=0&size=10&q=Page Patient&status=Cancelled")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5));

        mockMvc.perform(get("/api/appointments?page=0&size=10&q=Page Patient 2&status=Cancelled")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void patientAppointmentsPagingStaysScoped() throws Exception {
        mockMvc.perform(get("/api/appointments?page=0&size=2")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.hasNext").value(true));
    }

    @Test
    void appointmentsWithoutPageParamReturnLegacyArray() throws Exception {
        mockMvc.perform(get("/api/appointments")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(15));
    }

    @Test
    void labReportsPagingReturnsEnvelope() throws Exception {
        mockMvc.perform(get("/api/lab-reports?page=0&size=10")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(10))
                .andExpect(jsonPath("$.totalElements").value(12))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/api/lab-reports?page=0&size=10&q=Page Report 1")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4));
    }
}
