package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.entity.Appointment;
import com.meditru.service.AppointmentService;
import com.meditru.service.AuthService;
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
    public List<Appointment> list(@RequestParam(required = false) String patientId,
                                  @RequestParam(required = false) String doctorId) {
        if (patientId != null) return service.findByPatient(patientId);
        if (doctorId != null) return service.findByDoctor(doctorId);
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> get(@PathVariable Long id) {
        Appointment apt = service.findById(id);
        return apt != null ? ResponseEntity.ok(apt) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Appointment apt) {
        try {
            return ResponseEntity.ok(service.create(apt));
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

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
