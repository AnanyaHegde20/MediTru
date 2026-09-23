package com.meditru.service;

import com.meditru.dto.AuthUser;
import com.meditru.entity.Prescription;
import com.meditru.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PrescriptionService {

    public static final String ACTIVE = "Active";
    public static final String REFILL_REQUESTED = "Refill Requested";
    public static final String EXPIRED = "Expired";

    private static final Set<String> STATUSES = Set.of(ACTIVE, REFILL_REQUESTED, EXPIRED);

    private static final Map<String, Set<String>> TRANSITIONS = Map.of(
            ACTIVE, Set.of(EXPIRED),
            REFILL_REQUESTED, Set.of(ACTIVE, EXPIRED),
            EXPIRED, Set.of()
    );

    private final PrescriptionRepository repo;

    public PrescriptionService(PrescriptionRepository repo) {
        this.repo = repo;
    }

    public List<Prescription> findAll() { return repo.findAll(); }

    public Prescription findById(Long id) { return repo.findById(id).orElse(null); }

    public List<Prescription> findByPatient(String patientId) {
        return repo.findByPatientIdOrderByStartDateDesc(patientId);
    }

    public Prescription create(Prescription rx) {
        String status = rx.getStatus() == null || rx.getStatus().isBlank()
                ? ACTIVE : rx.getStatus().trim();
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("Unknown prescription status: " + status);
        }
        rx.setStatus(status);
        return repo.save(rx);
    }

    public Prescription update(Long id, Prescription updated, AuthUser actor) {
        if (actor == null || actor.id() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        if (!isAdmin(actor) && !isDoctor(actor)) {
            throw new IllegalArgumentException("Only doctors or admins can update prescriptions");
        }
        Prescription rx = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found"));
        if (updated.getStatus() != null) {
            String next = updated.getStatus().trim();
            if (!next.equals(rx.getStatus())) {
                applyStatusChange(rx, next);
            }
        }
        if (updated.getMedicationName() != null) rx.setMedicationName(updated.getMedicationName());
        if (updated.getDosage() != null) rx.setDosage(updated.getDosage());
        if (updated.getFrequency() != null) rx.setFrequency(updated.getFrequency());
        if (updated.getInstructions() != null) rx.setInstructions(updated.getInstructions());
        if (updated.getRefillsRemaining() != null) {
            if (updated.getRefillsRemaining() < 0) {
                throw new IllegalArgumentException("Refills remaining cannot be negative");
            }
            rx.setRefillsRemaining(updated.getRefillsRemaining());
        }
        return repo.save(rx);
    }

    public Prescription requestRefill(Long id, AuthUser actor) {
        if (actor == null || actor.id() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        if (!"patient".equals(actor.role())) {
            throw new IllegalArgumentException("Only patients can request refills");
        }
        Prescription rx = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found"));
        if (!actor.id().equals(rx.getPatientId())) {
            throw new IllegalArgumentException("You can only request a refill for your own prescription");
        }
        if (!ACTIVE.equals(rx.getStatus())) {
            throw new IllegalArgumentException("Only active prescriptions can be refilled");
        }
        if (rx.getRefillsRemaining() == null || rx.getRefillsRemaining() <= 0) {
            throw new IllegalArgumentException("No refills remaining");
        }
        rx.setStatus(REFILL_REQUESTED);
        return repo.save(rx);
    }

    private void applyStatusChange(Prescription rx, String next) {
        if (!STATUSES.contains(next)) {
            throw new IllegalArgumentException("Unknown prescription status: " + next);
        }
        String current = rx.getStatus() == null ? ACTIVE : rx.getStatus();
        Set<String> allowed = TRANSITIONS.getOrDefault(current, Set.of());
        if (!allowed.contains(next)) {
            throw new IllegalArgumentException(
                    "Invalid status change from '" + current + "' to '" + next + "'");
        }
        if (REFILL_REQUESTED.equals(current) && ACTIVE.equals(next)) {
            Integer left = rx.getRefillsRemaining();
            if (left == null || left <= 0) {
                throw new IllegalArgumentException("No refills remaining");
            }
            rx.setRefillsRemaining(left - 1);
        }
        rx.setStatus(next);
    }

    private boolean isAdmin(AuthUser actor) { return "admin".equals(actor.role()); }

    private boolean isDoctor(AuthUser actor) { return "doctor".equals(actor.role()); }

    public void delete(Long id) { repo.deleteById(id); }
}
