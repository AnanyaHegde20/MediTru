package com.meditru.controller;

import com.meditru.entity.Doctor;
import com.meditru.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService service;

    public DoctorController(DoctorService service) { this.service = service; }

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
    public Doctor create(@RequestBody Doctor doctor) { return service.create(doctor); }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Doctor doctor) {
        try {
            return ResponseEntity.ok(service.update(id, doctor));
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
