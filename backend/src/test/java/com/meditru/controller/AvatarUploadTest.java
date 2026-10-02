package com.meditru.controller;

import com.meditru.entity.Doctor;
import com.meditru.entity.User;
import com.meditru.repository.AppointmentRepository;
import com.meditru.repository.AuditLogRepository;
import com.meditru.repository.DoctorRepository;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AvatarUploadTest {

    private static final byte[] PNG_BYTES = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

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
    private String otherToken;
    private Long patientId;
    private Long otherId;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        appointmentRepository.deleteAll();
        doctorRepository.deleteAll();
        userRepository.deleteAll();

        User admin = userRepository.save(new User("Admin User", "admin@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.admin));
        User patient = userRepository.save(new User("Plain Patient", "patient@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.patient));
        User other = userRepository.save(new User("Other Patient", "other@test.com",
                passwordEncoder.encode("secret123"), User.UserRole.patient));
        patientId = patient.getId();
        otherId = other.getId();
        adminToken = jwtService.generateToken(admin);
        patientToken = jwtService.generateToken(patient);
        otherToken = jwtService.generateToken(other);
    }

    private MockMultipartFile avatarFile(String name) {
        return new MockMultipartFile("file", name, "image/png", PNG_BYTES);
    }

    @Test
    void patientUploadsOwnAvatarAndItServesPublicly() throws Exception {
        mockMvc.perform(multipart("/api/users/{id}/avatar", patientId)
                        .file(avatarFile("me.png"))
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar").value(
                        org.hamcrest.Matchers.startsWith("/api/users/" + patientId + "/avatar?v=")));

        mockMvc.perform(get("/api/users/" + patientId + "/avatar"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));
    }

    @Test
    void adminCanUploadAvatarForAnotherUser() throws Exception {
        mockMvc.perform(multipart("/api/users/{id}/avatar", patientId)
                        .file(avatarFile("admin-set.png"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar").value(
                        org.hamcrest.Matchers.startsWith("/api/users/" + patientId + "/avatar?v=")));

        mockMvc.perform(get("/api/audit-log?action=AVATAR_UPDATED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$[0].action").value("AVATAR_UPDATED"))
                .andExpect(jsonPath("$[0].actorRole").value("admin"));
    }

    @Test
    void patientCannotUploadAvatarForSomeoneElse() throws Exception {
        mockMvc.perform(multipart("/api/users/{id}/avatar", patientId)
                        .file(avatarFile("intruder.png"))
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsUnsupportedFileTypeAndOversizedFile() throws Exception {
        mockMvc.perform(multipart("/api/users/{id}/avatar", patientId)
                        .file(new MockMultipartFile("file", "evil.exe", "application/octet-stream", PNG_BYTES))
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isBadRequest());

        byte[] big = new byte[2 * 1024 * 1024 + 1];
        mockMvc.perform(multipart("/api/users/{id}/avatar", patientId)
                        .file(new MockMultipartFile("file", "huge.png", "image/png", big))
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void uploadRequiresAuthentication() throws Exception {
        mockMvc.perform(multipart("/api/users/{id}/avatar", patientId)
                        .file(avatarFile("anon.png")))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/" + patientId + "/avatar"))
                .andExpect(status().isNotFound());
    }

    @Test
    void uploadingSyncsTheMatchingDoctorProfile() throws Exception {
        Doctor doctor = new Doctor();
        doctor.setName("Dr. Sync");
        doctor.setEmail("patient@test.com");
        doctor.setSpecialty("Cardiology");
        doctor = doctorRepository.save(doctor);

        mockMvc.perform(multipart("/api/users/{id}/avatar", patientId)
                        .file(avatarFile("sync.png"))
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk());

        Doctor reloaded = doctorRepository.findById(doctor.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(reloaded.getAvatar())
                .startsWith("/api/users/" + patientId + "/avatar?v=");
    }
}
