package com.meditru.service;

import com.meditru.entity.Prescription;
import com.meditru.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PrescriptionService {

    private final PrescriptionRepository repo;

    public PrescriptionService(PrescriptionRepository repo) {
        this.repo = repo;
    }

    public List<Prescription> findAll() { return repo.findAll(); }

    public Prescription findById(Long id) { return repo.findById(id).orElse(null); }

    public List<Prescription> findByPatient(String patientId) {
        return repo.findByPatientIdOrderByStartDateDesc(patientId);
    }

    public Prescription create(Prescription rx) { return repo.save(rx); }

    public Prescription update(Long id, Prescription updated) {
        Prescription rx = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Prescription not found"));
        if (updated.getMedicationName() != null) rx.setMedicationName(updated.getMedicationName());
        if (updated.getDosage() != null) rx.setDosage(updated.getDosage());
        if (updated.getFrequency() != null) rx.setFrequency(updated.getFrequency());
        if (updated.getInstructions() != null) rx.setInstructions(updated.getInstructions());
        if (updated.getStatus() != null) rx.setStatus(updated.getStatus());
        if (updated.getRefillsRemaining() != null) rx.setRefillsRemaining(updated.getRefillsRemaining());
        return repo.save(rx);
    }

    public void delete(Long id) { repo.deleteById(id); }
}
