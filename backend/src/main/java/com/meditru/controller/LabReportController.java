package com.meditru.controller;

import com.meditru.entity.LabReport;
import com.meditru.service.LabReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lab-reports")
public class LabReportController {

    private final LabReportService service;

    public LabReportController(LabReportService service) { this.service = service; }

    @GetMapping
    public List<LabReport> list(@RequestParam(required = false) String patientId) {
        if (patientId != null) return service.findByPatient(patientId);
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabReport> get(@PathVariable Long id) {
        LabReport report = service.findById(id);
        return report != null ? ResponseEntity.ok(report) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public LabReport create(@RequestBody LabReport report) { return service.create(report); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
