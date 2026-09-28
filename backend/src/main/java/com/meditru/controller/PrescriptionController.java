package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.entity.Prescription;
import com.meditru.service.AuthService;
import com.meditru.service.PrescriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService service;
    private final AuthService authService;

    public PrescriptionController(PrescriptionService service, AuthService authService) {
        this.service = service;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<Prescription>> list(@RequestParam(required = false) String patientId,
                                                   Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            if ("patient".equals(actor.role())) {
                return ResponseEntity.ok(service.findByPatient(actor.id()));
            }
            if (patientId != null) return ResponseEntity.ok(service.findByPatient(patientId));
            return ResponseEntity.ok(service.findAll());
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Prescription> get(@PathVariable Long id, Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            Prescription rx = service.findById(id);
            if (rx == null || !canAccess(rx, actor)) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(rx);
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Prescription rx) {
        try {
            return ResponseEntity.ok(service.create(rx));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/refill")
    public ResponseEntity<?> refill(@PathVariable Long id, Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            return ResponseEntity.ok(service.requestRefill(id, actor));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Prescription rx,
                                    Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            return ResponseEntity.ok(service.update(id, rx, actor));
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

    private boolean canAccess(Prescription rx, AuthUser actor) {
        if ("admin".equals(actor.role()) || "doctor".equals(actor.role())) return true;
        return actor.id().equals(rx.getPatientId());
    }

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
