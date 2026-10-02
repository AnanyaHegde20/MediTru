package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.dto.PageEnvelope;
import com.meditru.entity.Appointment;
import com.meditru.service.AppointmentService;
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

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService service;
    private final AuthService authService;

    public AppointmentController(AppointmentService service, AuthService authService) {
        this.service = service;
        this.authService = authService;
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
            return ResponseEntity.ok(service.create(apt));
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
            return ResponseEntity.ok(service.update(id, apt, actor));
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
