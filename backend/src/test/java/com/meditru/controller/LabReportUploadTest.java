package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.entity.LabReport;
import com.meditru.entity.User;
import com.meditru.repository.LabReportRepository;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LabReportUploadTest {

    private static final byte[] PDF_BYTES = "%PDF-1.4 fake lab report content".getBytes();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LabReportRepository labReportRepository;

    @Autowired
    private JwtService jwtService;

    private String patientToken;
    private String otherPatientToken;
    private String doctorToken;
    private String adminToken;
    private String patientId;

    @BeforeEach
    void setUp() {
        labReportRepository.deleteAll();
        userRepository.deleteAll();

        User patient = userRepository.save(
                new User("Pat Patient", "pat-upload@example.com", "x", User.UserRole.patient));
        User other = userRepository.save(
                new User("Other Patient", "other-upload@example.com", "x", User.UserRole.patient));
        User doctor = userRepository.save(
                new User("Doc Doctor", "doc-upload@example.com", "x", User.UserRole.doctor));
        User admin = userRepository.save(
                new User("Adm Admin", "adm-upload@example.com", "x", User.UserRole.admin));

        patientToken = jwtService.generateToken(patient);
        otherPatientToken = jwtService.generateToken(other);
        doctorToken = jwtService.generateToken(doctor);
        adminToken = jwtService.generateToken(admin);
        patientId = String.valueOf(patient.getId());
    }

    private MockMultipartFile pdfFile() {
        return new MockMultipartFile("file", "lipid-panel.pdf", "application/pdf", PDF_BYTES);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder upload(
            String token, MockMultipartFile file) {
        return multipart("/api/lab-reports/upload")
                .file(file)
                .param("name", "Lipid Panel")
                .param("category", "Lipid")
                .param("patientId", patientId)
                .param("date", "Oct 22, 2024")
                .param("doctorName", "Dr. Alan Stone")
                .param("status", "Normal")
                .header("Authorization", "Bearer " + token);
    }

    @Test
    void uploadStoresFileAndReturnsMetadata() throws Exception {
        mockMvc.perform(upload(patientToken, pdfFile()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").isNotEmpty())
                .andExpect(jsonPath("$.contentType").value("application/pdf"))
                .andExpect(jsonPath("$.sizeBytes").value(PDF_BYTES.length))
                .andExpect(jsonPath("$.fileSize").value(PDF_BYTES.length + " B"))
                .andExpect(jsonPath("$.downloadUrl").value(containsString("/file")))
                .andExpect(jsonPath("$.name").value("Lipid Panel"));
    }

    @Test
    void uploadedFileCanBeDownloaded() throws Exception {
        MvcResult uploaded = mockMvc.perform(upload(patientToken, pdfFile()))
                .andExpect(status().isOk())
                .andReturn();
        long id = objectMapper.readTree(uploaded.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/lab-reports/" + id + "/file")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
                .andExpect(content().bytes(PDF_BYTES));
    }

    @Test
    void uploadRejectsUnsupportedFileType() throws Exception {
        MockMultipartFile exe = new MockMultipartFile(
                "file", "virus.exe", "application/octet-stream", new byte[] { 1, 2, 3 });

        mockMvc.perform(upload(patientToken, exe))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(
                        "Unsupported file type: exe (allowed: pdf, png, jpg, jpeg)"));
    }

    @Test
    void uploadRejectsMissingFile() throws Exception {
        mockMvc.perform(upload(patientToken, new MockMultipartFile(
                        "file", "empty.pdf", "application/pdf", new byte[0])))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("A file is required"));
    }

    @Test
    void patientCannotUploadForSomeoneElse() throws Exception {
        mockMvc.perform(multipart("/api/lab-reports/upload")
                        .file(pdfFile())
                        .param("name", "Not Mine")
                        .param("patientId", "999")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You can only upload reports for yourself"));
    }

    @Test
    void doctorCanUploadForAPatient() throws Exception {
        mockMvc.perform(upload(doctorToken, pdfFile()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value(patientId));
    }

    @Test
    void otherPatientCannotDownloadYourReport() throws Exception {
        MvcResult uploaded = mockMvc.perform(upload(patientToken, pdfFile()))
                .andExpect(status().isOk())
                .andReturn();
        long id = objectMapper.readTree(uploaded.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/lab-reports/" + id + "/file")
                        .header("Authorization", "Bearer " + otherPatientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error")
                        .value("You are not allowed to download this report"));
    }

    @Test
    void anonymousUploadAndDownloadAreRejected() throws Exception {
        mockMvc.perform(multipart("/api/lab-reports/upload").file(pdfFile()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/lab-reports/1/file"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void reportWithoutStoredFileReturnsNotFound() throws Exception {
        LabReport created = labReportRepository.save(new LabReport(patientId, "Seeded Report", "Lipid"));

        mockMvc.perform(get("/api/lab-reports/" + created.getId() + "/file")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("No file is stored for this report"));
    }

    @Test
    void deleteRemovesTheStoredFile() throws Exception {
        MvcResult uploaded = mockMvc.perform(upload(patientToken, pdfFile()))
                .andExpect(status().isOk())
                .andReturn();
        String body = uploaded.getResponse().getContentAsString();
        long id = objectMapper.readTree(body).get("id").asLong();
        String fileName = objectMapper.readTree(body).get("fileName").asText();
        Path stored = Path.of(System.getProperty("java.io.tmpdir"),
                "meditru-test-uploads", fileName);
        org.junit.jupiter.api.Assertions.assertTrue(Files.exists(stored));

        mockMvc.perform(delete("/api/lab-reports/" + id)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertFalse(Files.exists(stored));
        mockMvc.perform(get("/api/lab-reports/" + id)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isNotFound());
    }
}
