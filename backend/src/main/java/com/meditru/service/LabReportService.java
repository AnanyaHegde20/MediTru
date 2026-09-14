package com.meditru.service;

import com.meditru.entity.LabReport;
import com.meditru.repository.LabReportRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LabReportService {

    private final LabReportRepository repo;

    public LabReportService(LabReportRepository repo) {
        this.repo = repo;
    }

    public List<LabReport> findAll() { return repo.findAll(); }

    public LabReport findById(Long id) { return repo.findById(id).orElse(null); }

    public List<LabReport> findByPatient(String patientId) {
        return repo.findByPatientIdOrderByDateDesc(patientId);
    }

    public LabReport create(LabReport report) { return repo.save(report); }

    public void delete(Long id) { repo.deleteById(id); }
}
