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
    public List<Prescription> list(@RequestParam(required = false) String patientId) {
        if (patientId != null) return service.findByPatient(patientId);
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Prescription> get(@PathVariable Long id) {
        Prescription rx = service.findById(id);
        return rx != null ? ResponseEntity.ok(rx) : ResponseEntity.notFound().build();
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

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
