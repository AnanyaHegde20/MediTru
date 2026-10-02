package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.entity.Doctor;
import com.meditru.service.AuditLogService;
import com.meditru.service.AuthService;
import com.meditru.service.DoctorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService service;
    private final AuthService authService;
    private final AuditLogService auditLog;

    public DoctorController(DoctorService service, AuthService authService, AuditLogService auditLog) {
        this.service = service;
        this.authService = authService;
        this.auditLog = auditLog;
    }

    @GetMapping
    public List<Doctor> list(@RequestParam(required = false) String q,
                             @RequestParam(required = false) String specialty) {
        if (q != null && !q.isBlank()) return service.search(q);
        if (specialty != null && !specialty.isBlank()) return service.findBySpecialty(specialty);
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> get(@PathVariable Long id) {
        Doctor doc = service.findById(id);
        return doc != null ? ResponseEntity.ok(doc) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Doctor doctor, Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            Doctor created = service.create(doctor);
            auditLog.record(actor.email(), actor.role(), "DOCTOR_CREATED",
                    "doctor", String.valueOf(created.getId()), "Added " + created.getName());
            return ResponseEntity.ok(created);
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Doctor doctor,
                                    Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            Doctor existing = service.findById(id);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }
            if (!"admin".equals(actor.role()) && !isOwnProfile(existing, actor)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only edit your own availability"));
            }
            return ResponseEntity.ok(service.update(id, doctor));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        Doctor existing = service.findById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        AuthUser actor = requireActor(authentication);
        service.delete(id);
        auditLog.record(actor.email(), actor.role(), "DOCTOR_DELETED",
                "doctor", String.valueOf(id), "Removed " + existing.getName());
        return ResponseEntity.noContent().build();
    }

    private boolean isOwnProfile(Doctor doctor, AuthUser actor) {
        return doctor.getEmail() != null
                && actor.email() != null
                && doctor.getEmail().equalsIgnoreCase(actor.email());
    }

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
