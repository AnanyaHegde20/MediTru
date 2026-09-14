package com.meditru.controller;

import com.meditru.entity.Prescription;
import com.meditru.service.PrescriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService service;

    public PrescriptionController(PrescriptionService service) { this.service = service; }

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
    public Prescription create(@RequestBody Prescription rx) { return service.create(rx); }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Prescription rx) {
        try {
            return ResponseEntity.ok(service.update(id, rx));
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
