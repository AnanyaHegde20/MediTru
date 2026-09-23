package com.meditru.service;

import com.meditru.dto.AuthUser;
import com.meditru.entity.Appointment;
import com.meditru.repository.AppointmentRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AppointmentService {

    public static final String PENDING = "Pending";
    public static final String CONFIRMED = "Confirmed";
    public static final String IN_PROGRESS = "In Progress";
    public static final String COMPLETED = "Completed";
    public static final String CANCELLED = "Cancelled";

    private static final Set<String> STATUSES = Set.of(PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED);
    private static final Set<String> CREATABLE_STATUSES = Set.of(PENDING, CONFIRMED);

    private static final Map<String, Set<String>> TRANSITIONS = Map.of(
            PENDING, Set.of(CONFIRMED, CANCELLED),
            CONFIRMED, Set.of(IN_PROGRESS, CANCELLED),
            IN_PROGRESS, Set.of(COMPLETED),
            COMPLETED, Set.of(),
            CANCELLED, Set.of()
    );

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

    public Appointment create(Appointment apt) {
        String status = apt.getStatus() == null || apt.getStatus().isBlank()
                ? PENDING : apt.getStatus().trim();
        if (!CREATABLE_STATUSES.contains(status)) {
            throw new IllegalArgumentException("New appointments must start as Pending or Confirmed");
        }
        apt.setStatus(status);
        return repo.save(apt);
    }

    public Appointment update(Long id, Appointment updated, AuthUser actor) {
        Appointment apt = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        if (actor == null || actor.id() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        boolean isOwner = actor.id().equals(String.valueOf(apt.getPatientId()));
        boolean privileged = isAdmin(actor) || isDoctor(actor);
        if (!privileged && !isOwner) {
            throw new IllegalArgumentException("You are not allowed to update this appointment");
        }
        if (updated.getStatus() != null) {
            String next = updated.getStatus().trim();
            if (!next.equals(apt.getStatus())) {
                applyStatusChange(apt, next, isOwner, privileged);
            }
        }
        if (updated.getDate() != null) apt.setDate(updated.getDate());
        if (updated.getTime() != null) apt.setTime(updated.getTime());
        if (updated.getType() != null) apt.setType(updated.getType());
        if (updated.getDuration() != null) apt.setDuration(updated.getDuration());
        if (updated.getNotes() != null) apt.setNotes(updated.getNotes());
        if (updated.getRoom() != null) apt.setRoom(updated.getRoom());
        return repo.save(apt);
    }

    private void applyStatusChange(Appointment apt, String next, boolean isOwner, boolean privileged) {
        if (!STATUSES.contains(next)) {
            throw new IllegalArgumentException("Unknown appointment status: " + next);
        }
        String current = apt.getStatus();
        Set<String> allowed = TRANSITIONS.getOrDefault(current, Set.of());
        if (!allowed.contains(next)) {
            throw new IllegalArgumentException(
                    "Invalid status change from '" + current + "' to '" + next + "'");
        }
        if (CANCELLED.equals(next)) {
            if (!privileged && !isOwner) {
                throw new IllegalArgumentException("Only the patient, a doctor, or an admin can cancel");
            }
        } else if (!privileged) {
            throw new IllegalArgumentException("Only a doctor or admin can set status to '" + next + "'");
        }
        apt.setStatus(next);
    }

    private boolean isAdmin(AuthUser actor) { return "admin".equals(actor.role()); }

    private boolean isDoctor(AuthUser actor) { return "doctor".equals(actor.role()); }

    public void delete(Long id) { repo.deleteById(id); }
}
