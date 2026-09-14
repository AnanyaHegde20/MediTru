package com.meditru.service;

import com.meditru.entity.Appointment;
import com.meditru.repository.AppointmentRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository repo;

    public AppointmentService(AppointmentRepository repo) {
        this.repo = repo;
    }

    public List<Appointment> findAll() { return repo.findAll(); }

    public Appointment findById(Long id) { return repo.findById(id).orElse(null); }

    public List<Appointment> findByPatient(String patientId) {
        return repo.findByPatientIdOrderByDateDesc(patientId);
    }

    public List<Appointment> findByDoctor(String doctorId) {
        return repo.findByDoctorIdOrderByDateDesc(doctorId);
    }

    public Appointment create(Appointment apt) { return repo.save(apt); }

    public Appointment update(Long id, Appointment updated) {
        Appointment apt = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        if (updated.getDate() != null) apt.setDate(updated.getDate());
        if (updated.getTime() != null) apt.setTime(updated.getTime());
        if (updated.getStatus() != null) apt.setStatus(updated.getStatus());
        if (updated.getType() != null) apt.setType(updated.getType());
        if (updated.getDuration() != null) apt.setDuration(updated.getDuration());
        if (updated.getNotes() != null) apt.setNotes(updated.getNotes());
        if (updated.getRoom() != null) apt.setRoom(updated.getRoom());
        return repo.save(apt);
    }

    public void delete(Long id) { repo.deleteById(id); }
}
