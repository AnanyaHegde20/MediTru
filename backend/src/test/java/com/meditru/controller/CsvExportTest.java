package com.meditru.controller;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CsvExportTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String doctorToken;
    private String patientToken;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        userRepository.deleteAll();

        User admin = userRepository.save(new User("CSV Admin", "csv-admin@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.admin));
        User doctor = userRepository.save(new User("CSV Doctor", "csv-doctor@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.doctor));
        User patient = userRepository.save(new User("CSV Patient", "csv-patient@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.patient));
        adminToken = jwtService.generateToken(admin);
        doctorToken = jwtService.generateToken(doctor);
        patientToken = jwtService.generateToken(patient);

        Appointment apt = new Appointment();
        apt.setPatientId(String.valueOf(patient.getId()));
        apt.setPatientName("CSV, Export \"Patient\"");
        apt.setDoctorId("1");
        apt.setDoctorName("Dr. CSV");
        apt.setSpecialty("Cardiology");
        apt.setDate("Dec 01, 2024");
        apt.setTime("10:00 AM");
        apt.setStatus("Confirmed");
        apt.setNotes("Needs, extra\ncare");
        appointmentRepository.save(apt);
    }

    @Test
    void adminExportsAppointmentsCsv() throws Exception {
        String csv = mockMvc.perform(get("/api/appointments/export")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"appointments.csv\""))
                .andReturn().getResponse().getContentAsString();

        assertTrue(csv.startsWith("ID,Patient ID,Patient,Doctor ID,Doctor,Specialty,Date,Time,Status,Type,Room,Notes"));
        assertTrue(csv.contains("\"CSV, Export \"\"Patient\"\"\""));
        assertTrue(csv.contains("\"Needs, extra\ncare\""));
    }

    @Test
    void appointmentExportIsAdminOnly() throws Exception {
        mockMvc.perform(get("/api/appointments/export"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/appointments/export")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/appointments/export")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminExportsUsersCsvWithoutPasswords() throws Exception {
        String csv = mockMvc.perform(get("/api/users/export")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"users.csv\""))
                .andReturn().getResponse().getContentAsString();

        assertTrue(csv.startsWith("ID,Name,Email,Role,Phone,Age,Gender,Blood Group"));
        assertTrue(csv.contains("csv-admin@test.com"));
        assertFalse(csv.toLowerCase().contains("password"));
        assertFalse(csv.contains("$2a$"));
    }

    @Test
    void usersExportIsAdminOnly() throws Exception {
        mockMvc.perform(get("/api/users/export"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/export")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden());
    }
}
