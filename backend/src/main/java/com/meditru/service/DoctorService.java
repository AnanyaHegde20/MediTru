package com.meditru.service;

import com.meditru.entity.Doctor;
import com.meditru.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository repo;

    public DoctorService(DoctorRepository repo) {
        this.repo = repo;
    }

    public List<Doctor> findAll() { return repo.findAll(); }

    public Doctor findById(Long id) { return repo.findById(id).orElse(null); }

    public List<Doctor> search(String q) {
        if (q == null || q.isBlank()) return repo.findAll();
        return repo.findByNameContainingIgnoreCase(q);
    }

    public List<Doctor> findBySpecialty(String specialty) {
        return repo.findBySpecialtyContainingIgnoreCase(specialty);
    }

    public Doctor create(Doctor doctor) { return repo.save(doctor); }

    public Doctor update(Long id, Doctor updated) {
        Doctor doc = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
        if (updated.getName() != null) doc.setName(updated.getName());
        if (updated.getSpecialty() != null) doc.setSpecialty(updated.getSpecialty());
        if (updated.getRating() != null) doc.setRating(updated.getRating());
        if (updated.getReviewCount() != null) doc.setReviewCount(updated.getReviewCount());
        if (updated.getExperienceYears() != null) doc.setExperienceYears(updated.getExperienceYears());
        if (updated.getConsultationFee() != null) doc.setConsultationFee(updated.getConsultationFee());
        if (updated.getNextAvailable() != null) doc.setNextAvailable(updated.getNextAvailable());
        if (updated.getAvatar() != null) doc.setAvatar(updated.getAvatar());
        if (updated.getBio() != null) doc.setBio(updated.getBio());
        if (updated.getHospital() != null) doc.setHospital(updated.getHospital());
        if (updated.getEducation() != null) doc.setEducation(updated.getEducation());
        if (updated.getSlotsJson() != null) doc.setSlotsJson(updated.getSlotsJson());
        return repo.save(doc);
    }

    public void delete(Long id) { repo.deleteById(id); }
}
