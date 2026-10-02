package com.meditru.controller;

import com.meditru.entity.Appointment;
import com.meditru.entity.User;
import com.meditru.repository.AppointmentRepository;
import com.meditru.repository.NotificationRepository;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import com.meditru.service.NotificationService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private NotificationService notificationService;

    private String patientToken;
    private String doctorToken;
    private String adminToken;
    private Long patientId;
    private Appointment pendingApt;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        appointmentRepository.deleteAll();
        userRepository.deleteAll();

        User patient = userRepository.save(new User("Priya Patient", "patient@notify.test",
                passwordEncoder.encode("secret123"), User.UserRole.patient));
        User other = userRepository.save(new User("Other Patient", "other@notify.test",
                passwordEncoder.encode("secret123"), User.UserRole.patient));
        User doctor = userRepository.save(new User("Dr. Stone", "doctor@notify.test",
                passwordEncoder.encode("secret123"), User.UserRole.doctor));
        User admin = userRepository.save(new User("Admin User", "admin@notify.test",
                passwordEncoder.encode("secret123"), User.UserRole.admin));
        patientId = patient.getId();

        patientToken = jwtService.generateToken(patient);
        doctorToken = jwtService.generateToken(doctor);
        adminToken = jwtService.generateToken(admin);

        pendingApt = saveApt(patient, "Pending", "Dr. Stone");
        saveApt(patient, "Confirmed", "Dr. Stone");
        saveApt(patient, "Cancelled", "Dr. Stone");
        saveApt(other, "Pending", "Dr. Someone Else");
    }

    private Appointment saveApt(User patient, String status, String doctorName) {
        Appointment apt = new Appointment();
        apt.setPatientId(String.valueOf(patient.getId()));
        apt.setPatientName(patient.getName());
        apt.setDoctorId("99");
        apt.setDoctorName(doctorName);
        apt.setSpecialty("Cardiology");
        apt.setDate("Oct 24, 2026");
        apt.setTime("10:00 AM");
        apt.setStatus(status);
        apt.setType("Checkup");
        return appointmentRepository.save(apt);
    }

    @Test
    void notificationsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/notifications/read-all"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void patientReceivesRemindersForOwnOpenAppointments() throws Exception {
        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.title == 'Appointment Reminder')]").exists())
                .andExpect(jsonPath("$[?(@.timeLabel == 'Oct 24')]").exists())
                .andExpect(jsonPath("$[0].desc").value("Dr. Stone • Oct 24, 2026 at 10:00 AM"))
                .andExpect(jsonPath("$[?(@.readAt == null)]").exists());
    }

    @Test
    void doctorReceivesOnlyPendingRequestsForTheirAppointments() throws Exception {
        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Appointment Request"))
                .andExpect(jsonPath("$[0].desc").value("Priya Patient • Oct 24, 2026 at 10:00 AM"));
    }

    @Test
    void adminSeesPlatformPendingAppointments() throws Exception {
        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.title == 'Pending Appointment')]").exists());
    }

    @Test
    void scansAreIdempotent() throws Exception {
        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void readAllPersistsReadStateServerSide() throws Exception {
        mockMvc.perform(post("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All notifications marked read"));

        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].readAt").isNotEmpty())
                .andExpect(jsonPath("$[1].readAt").isNotEmpty());
    }

    @Test
    void remindersDisappearWhenAppointmentIsNoLongerOpen() throws Exception {
        pendingApt.setStatus("Cancelled");
        appointmentRepository.save(pendingApt);
        notificationService.scheduledScan();

        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Appointment Reminder"));

        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
