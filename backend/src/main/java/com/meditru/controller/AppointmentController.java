package com.meditru.controller;

import com.meditru.entity.Appointment;
import com.meditru.service.AppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) { this.service = service; }

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
    public Appointment create(@RequestBody Appointment apt) { return service.create(apt); }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Appointment apt) {
        try {
            return ResponseEntity.ok(service.update(id, apt));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
