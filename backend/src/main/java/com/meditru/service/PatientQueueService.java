package com.meditru.service;

import com.meditru.entity.PatientQueue;
import com.meditru.repository.PatientQueueRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;

@Service
public class PatientQueueService {

    private static final Set<String> STATUSES = Set.of("Waiting", "In Progress", "Done");

    private final PatientQueueRepository repo;

    public PatientQueueService(PatientQueueRepository repo) {
        this.repo = repo;
    }

    public List<PatientQueue> findAll() { return repo.findAll(); }

    public PatientQueue findById(Long id) { return repo.findById(id).orElse(null); }

    public List<PatientQueue> findByDoctor(String doctorId) {
        return repo.findByDoctorId(doctorId);
    }

    public PatientQueue create(PatientQueue item) { return repo.save(item); }

    public PatientQueue update(Long id, PatientQueue updated) {
        PatientQueue item = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Queue item not found"));
        if (updated.getStatus() != null) {
            String status = updated.getStatus().trim();
            if (!STATUSES.contains(status)) {
                throw new IllegalArgumentException("Unknown queue status: " + status);
            }
            item.setStatus(status);
        }
        if (updated.getRoom() != null) item.setRoom(updated.getRoom());
        if (updated.getWaitTime() != null) item.setWaitTime(updated.getWaitTime());
        return repo.save(item);
    }

    public void delete(Long id) { repo.deleteById(id); }
}
