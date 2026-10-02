package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.dto.PageEnvelope;
import com.meditru.entity.Appointment;
import com.meditru.service.AppointmentService;
import com.meditru.service.AuditLogService;
import com.meditru.service.AuthService;
import com.meditru.util.Csv;
import com.meditru.util.Filters;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService service;
    private final AuthService authService;
    private final AuditLogService auditLog;

    public AppointmentController(AppointmentService service, AuthService authService, AuditLogService auditLog) {
        this.service = service;
        this.authService = authService;
        this.auditLog = auditLog;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String patientId,
                                  @RequestParam(required = false) String doctorId,
                                  @RequestParam(required = false) Integer page,
                                  @RequestParam(required = false) Integer size,
                                  @RequestParam(required = false) String q,
                                  @RequestParam(required = false) String status,
                                  Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            List<Appointment> scoped;
            if ("patient".equals(actor.role())) {
                scoped = service.findByPatient(actor.id());
            } else if (patientId != null) {
                scoped = service.findByPatient(patientId);
            } else if (doctorId != null) {
                scoped = service.findByDoctor(doctorId);
            } else {
                scoped = service.findAll();
            }
            List<Appointment> filtered = scoped.stream()
                    .filter(a -> Filters.matches(q, a.getPatientName(), a.getDoctorName(), a.getSpecialty(), a.getType()))
                    .filter(a -> Filters.statusMatches(status, a.getStatus()))
                    .toList();
            if (page == null) {
                return ResponseEntity.ok(filtered);
            }
            return ResponseEntity.ok(PageEnvelope.of(filtered, page, size == null ? 10 : size));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }
    }

    @GetMapping(value = "/export", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<String> exportCsv(Authentication authentication) {
        try {
            requireActor(authentication);
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        StringBuilder csv = new StringBuilder();
        csv.append(Csv.row("ID", "Patient ID", "Patient", "Doctor ID", "Doctor", "Specialty",
                "Date", "Time", "Status", "Type", "Room", "Notes"));
        for (Appointment apt : service.findAll()) {
            csv.append(Csv.row(
                    String.valueOf(apt.getId()),
                    apt.getPatientId(),
                    apt.getPatientName(),
                    apt.getDoctorId(),
                    apt.getDoctorName(),
                    apt.getSpecialty(),
                    apt.getDate(),
                    apt.getTime(),
                    apt.getStatus(),
                    apt.getType(),
                    apt.getRoom(),
                    apt.getNotes()));
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"appointments.csv\"")
                .body(csv.toString());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> get(@PathVariable Long id, Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            Appointment apt = service.findById(id);
            if (apt == null || !canAccess(apt, actor)) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(apt);
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Appointment apt, Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            String owner = apt.getPatientId() != null && !apt.getPatientId().isBlank()
                    ? apt.getPatientId().trim()
                    : actor.id();
            if (!"admin".equals(actor.role()) && !"doctor".equals(actor.role())
                    && !owner.equals(actor.id())) {
                throw new IllegalArgumentException("You can only book appointments for yourself");
            }
            apt.setPatientId(owner);
            Appointment created = service.create(apt);
            auditLog.record(actor.email(), actor.role(), "APPOINTMENT_BOOKED",
                    "appointment", String.valueOf(created.getId()),
                    created.getPatientName() + " with " + created.getDoctorName() + " on " + created.getDate());
            return ResponseEntity.ok(created);
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Appointment apt,
                                    Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            Appointment before = service.findById(id);
            String oldStatus = before != null ? before.getStatus() : null;
            Appointment updated = service.update(id, apt, actor);
            if (oldStatus != null && !Objects.equals(oldStatus, updated.getStatus())) {
                auditLog.record(actor.email(), actor.role(), "APPOINTMENT_STATUS_CHANGED",
                        "appointment", String.valueOf(id),
                        oldStatus + " \u2192 " + updated.getStatus());
            }
            return ResponseEntity.ok(updated);
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private boolean canAccess(Appointment apt, AuthUser actor) {
        if ("admin".equals(actor.role()) || "doctor".equals(actor.role())) return true;
        return actor.id().equals(apt.getPatientId());
    }

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
