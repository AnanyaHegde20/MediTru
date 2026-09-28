package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.entity.LabReport;
import com.meditru.service.AuthService;
import com.meditru.service.LabReportService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab-reports")
public class LabReportController {

    private final LabReportService service;
    private final AuthService authService;

    public LabReportController(LabReportService service, AuthService authService) {
        this.service = service;
        this.authService = authService;
    }

    @GetMapping
    public List<LabReport> list(@RequestParam(required = false) String patientId) {
        if (patientId != null) return service.findByPatient(patientId);
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabReport> get(@PathVariable Long id) {
        LabReport report = service.findById(id);
        return report != null ? ResponseEntity.ok(report) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public LabReport create(@RequestBody LabReport report) { return service.create(report); }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam(value = "file", required = false) MultipartFile file,
                                    @RequestParam(value = "patientId", required = false) String patientId,
                                    @RequestParam(value = "name", required = false) String name,
                                    @RequestParam(value = "category", required = false) String category,
                                    @RequestParam(value = "date", required = false) String date,
                                    @RequestParam(value = "doctorName", required = false) String doctorName,
                                    @RequestParam(value = "doctorSpecialty", required = false) String doctorSpecialty,
                                    @RequestParam(value = "status", required = false) String status,
                                    @RequestParam(value = "valuesJson", required = false) String valuesJson,
                                    @RequestParam(value = "aiSummaryJson", required = false) String aiSummaryJson,
                                    Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            String effectivePatientId = resolvePatientId(patientId, actor);
            if (!"admin".equals(actor.role()) && !"doctor".equals(actor.role())
                    && !effectivePatientId.equals(actor.id())) {
                throw new IllegalArgumentException("You can only upload reports for yourself");
            }

            LabReport metadata = new LabReport(effectivePatientId, name, category);
            metadata.setDate(date);
            metadata.setDoctorName(doctorName);
            metadata.setDoctorSpecialty(doctorSpecialty);
            metadata.setStatus(status);
            metadata.setValuesJson(valuesJson);
            metadata.setAiSummaryJson(aiSummaryJson);

            return ResponseEntity.ok(service.upload(file, metadata));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<?> download(@PathVariable Long id, Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            LabReport report = service.findById(id);
            if (report == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Lab report not found"));
            }
            if (!canAccess(report, actor)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You are not allowed to download this report"));
            }
            Path file = service.resolveFile(report);
            if (file == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No file is stored for this report"));
            }

            MediaType mediaType = report.getContentType() == null
                    ? MediaType.APPLICATION_OCTET_STREAM
                    : MediaType.parseMediaType(report.getContentType());
            String downloadName = report.getFileName();
            ContentDisposition disposition = ContentDisposition.attachment()
                    .filename(downloadName)
                    .build();
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                    .body(new FileSystemResource(file));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            LabReport report = service.findById(id);
            if (report != null && !canAccess(report, actor)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You are not allowed to delete this report"));
            }
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    private boolean canAccess(LabReport report, AuthUser actor) {
        if ("admin".equals(actor.role()) || "doctor".equals(actor.role())) return true;
        return actor.id().equals(report.getPatientId());
    }

    private String resolvePatientId(String patientId, AuthUser actor) {
        if (patientId != null && !patientId.isBlank()) return patientId.trim();
        return actor.id();
    }

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
