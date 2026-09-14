package com.meditru.controller;

import com.meditru.entity.PatientQueue;
import com.meditru.service.PatientQueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patient-queue")
public class PatientQueueController {

    private final PatientQueueService service;

    public PatientQueueController(PatientQueueService service) { this.service = service; }

    @GetMapping
    public List<PatientQueue> list(@RequestParam(required = false) String doctorId) {
        if (doctorId != null) return service.findByDoctor(doctorId);
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientQueue> get(@PathVariable Long id) {
        PatientQueue item = service.findById(id);
        return item != null ? ResponseEntity.ok(item) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public PatientQueue create(@RequestBody PatientQueue item) { return service.create(item); }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PatientQueue item) {
        try {
            return ResponseEntity.ok(service.update(id, item));
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
