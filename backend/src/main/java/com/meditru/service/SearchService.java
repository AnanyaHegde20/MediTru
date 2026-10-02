package com.meditru.service;

import com.meditru.dto.AuthUser;
import com.meditru.dto.SearchResult;
import com.meditru.entity.Appointment;
import com.meditru.entity.Doctor;
import com.meditru.entity.LabReport;
import com.meditru.entity.User;
import com.meditru.entity.User.UserRole;
import com.meditru.repository.AppointmentRepository;
import com.meditru.repository.DoctorRepository;
import com.meditru.repository.LabReportRepository;
import com.meditru.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class SearchService {

    private static final int MAX_PER_TYPE = 5;
    private static final int MIN_QUERY_LENGTH = 2;

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final LabReportRepository labReportRepository;

    public SearchService(UserRepository userRepository,
                         DoctorRepository doctorRepository,
                         AppointmentRepository appointmentRepository,
                         LabReportRepository labReportRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.labReportRepository = labReportRepository;
    }

    public List<SearchResult> search(String rawQuery, AuthUser actor) {
        String q = rawQuery == null ? "" : rawQuery.trim().toLowerCase(Locale.ROOT);
        if (q.length() < MIN_QUERY_LENGTH) {
            return List.of();
        }

        List<SearchResult> results = new ArrayList<>();

        // Doctors browse the directory as patients and admins do.
        if (!"doctor".equals(actor.role())) {
            doctorRepository.findAll().stream()
                    .filter(d -> matches(q, d.getName(), d.getSpecialty(), d.getHospital()))
                    .limit(MAX_PER_TYPE)
                    .forEach(d -> results.add(new SearchResult(
                            "doctor",
                            String.valueOf(d.getId()),
                            d.getName(),
                            joinNonBlank(d.getSpecialty(), d.getHospital()))));
        }

        if ("admin".equals(actor.role())) {
            userRepository.findAll().stream()
                    .filter(u -> matches(q, u.getName(), u.getEmail(), u.getRole().name()))
                    .limit(MAX_PER_TYPE)
                    .forEach(u -> results.add(new SearchResult(
                            "user",
                            String.valueOf(u.getId()),
                            u.getName(),
                            joinNonBlank(u.getEmail(), u.getRole().name()))));
        } else if ("doctor".equals(actor.role())) {
            userRepository.findByRoleOrderByNameAsc(UserRole.patient).stream()
                    .filter(u -> matches(q, u.getName(), u.getEmail()))
                    .limit(MAX_PER_TYPE)
                    .forEach(u -> results.add(new SearchResult(
                            "patient",
                            String.valueOf(u.getId()),
                            u.getName(),
                            u.getEmail())));
        }

        List<Appointment> appointments = "patient".equals(actor.role())
                ? appointmentRepository.findByPatientIdOrderByDateDesc(actor.id())
                : appointmentRepository.findAll();
        appointments.stream()
                .filter(a -> matches(q, a.getPatientName(), a.getDoctorName(), a.getSpecialty(), a.getType()))
                .limit(MAX_PER_TYPE)
                .forEach(a -> results.add(new SearchResult(
                        "appointment",
                        String.valueOf(a.getId()),
                        a.getDoctorName(),
                        joinNonBlank(a.getPatientName(), a.getDate(), a.getStatus()))));

        // Admins have no records view, so lab results are only useful to patients and doctors.
        if (!"admin".equals(actor.role())) {
            List<LabReport> reports = "patient".equals(actor.role())
                    ? labReportRepository.findByPatientIdOrderByDateDesc(actor.id())
                    : labReportRepository.findAll();
            reports.stream()
                    .filter(r -> matches(q, r.getName(), r.getCategory(), r.getDoctorName()))
                    .limit(MAX_PER_TYPE)
                    .forEach(r -> results.add(new SearchResult(
                            "lab",
                            String.valueOf(r.getId()),
                            r.getName(),
                            joinNonBlank(r.getCategory(), r.getDate(), r.getStatus()))));
        }

        return results;
    }

    private boolean matches(String q, String... fields) {
        for (String field : fields) {
            if (field != null && field.toLowerCase(Locale.ROOT).contains(q)) {
                return true;
            }
        }
        return false;
    }

    private String joinNonBlank(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part == null || part.isBlank()) continue;
            if (sb.length() > 0) sb.append(" \u00b7 ");
            sb.append(part.trim());
        }
        return sb.toString();
    }
}
