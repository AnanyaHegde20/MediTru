package com.meditru.service;

import com.meditru.entity.Appointment;
import com.meditru.entity.Notification;
import com.meditru.entity.User;
import com.meditru.repository.AppointmentRepository;
import com.meditru.repository.NotificationRepository;
import com.meditru.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notifications;
    private final AppointmentRepository appointments;
    private final UserRepository users;

    public NotificationService(NotificationRepository notifications,
                               AppointmentRepository appointments,
                               UserRepository users) {
        this.notifications = notifications;
        this.appointments = appointments;
        this.users = users;
    }

    @Scheduled(
            fixedDelayString = "${meditru.notifications.scan-interval-ms:60000}",
            initialDelayString = "${meditru.notifications.scan-initial-delay-ms:15000}")
    public void scheduledScan() {
        try {
            scan();
        } catch (Exception e) {
            log.error("[MediTru] notification scan failed", e);
        }
    }

    public List<Notification> listFor(String email) {
        scan();
        return notifications.findAllByEmailOrderByCreatedAtDesc(email);
    }

    @Transactional
    public int scan() {
        List<User> allUsers = users.findAll();
        Map<String, User> usersById = new HashMap<>();
        List<User> doctorUsers = new ArrayList<>();
        List<User> adminUsers = new ArrayList<>();
        for (User user : allUsers) {
            usersById.put(String.valueOf(user.getId()), user);
            if (user.getRole() == User.UserRole.doctor) doctorUsers.add(user);
            if (user.getRole() == User.UserRole.admin) adminUsers.add(user);
        }

        Map<String, Desired> desired = new LinkedHashMap<>();
        for (Appointment apt : appointments.findAll()) {
            boolean pending = "Pending".equals(apt.getStatus());
            boolean open = pending || "Confirmed".equals(apt.getStatus());
            if (!open) continue;

            User patient = usersById.get(apt.getPatientId());
            if (patient != null) {
                desired.put(key(patient.getEmail(), apt.getId()), new Desired(patient, apt));
            }
            if (pending) {
                User doctor = findDoctorByName(doctorUsers, apt.getDoctorName());
                if (doctor != null) {
                    desired.put(key(doctor.getEmail(), apt.getId()), new Desired(doctor, apt));
                }
                for (User admin : adminUsers) {
                    desired.put(key(admin.getEmail(), apt.getId()), new Desired(admin, apt));
                }
            }
        }

        Map<String, Notification> existingByKey = new HashMap<>();
        for (Notification notification : notifications.findAll()) {
            existingByKey.put(key(notification.getEmail(), notification.getAppointmentId()), notification);
        }

        List<Notification> toDelete = new ArrayList<>();
        List<Notification> toSave = new ArrayList<>();
        int created = 0;

        for (Map.Entry<String, Notification> entry : existingByKey.entrySet()) {
            if (!desired.containsKey(entry.getKey())) {
                toDelete.add(entry.getValue());
            }
        }
        for (Map.Entry<String, Desired> entry : desired.entrySet()) {
            Desired d = entry.getValue();
            Notification notification = existingByKey.get(entry.getKey());
            if (notification == null) {
                Notification fresh = new Notification();
                fresh.setEmail(d.user.getEmail());
                fresh.setAppointmentId(d.appointment.getId());
                applyContent(fresh, d.user, d.appointment);
                toSave.add(fresh);
                created++;
            } else {
                String before = contentKey(notification);
                applyContent(notification, d.user, d.appointment);
                if (!before.equals(contentKey(notification))) {
                    toSave.add(notification);
                }
            }
        }

        if (!toDelete.isEmpty()) notifications.deleteAll(toDelete);
        if (!toSave.isEmpty()) notifications.saveAll(toSave);
        return created;
    }

    @Transactional
    public int markAllRead(String email) {
        scan();
        List<Notification> rows = notifications.findAllByEmailOrderByCreatedAtDesc(email);
        Instant now = Instant.now();
        int updated = 0;
        for (Notification row : rows) {
            if (row.getReadAt() == null) {
                row.setReadAt(now);
                updated++;
            }
        }
        if (updated > 0) notifications.saveAll(rows);
        return updated;
    }

    private void applyContent(Notification notification, User recipient, Appointment apt) {
        switch (recipient.getRole()) {
            case patient -> {
                notification.setTitle("Appointment Reminder");
                notification.setDesc(apt.getDoctorName() + " • " + apt.getDate() + " at " + apt.getTime());
            }
            case doctor -> {
                notification.setTitle("Appointment Request");
                notification.setDesc(apt.getPatientName() + " • " + apt.getDate() + " at " + apt.getTime());
            }
            default -> {
                notification.setTitle("Pending Appointment");
                notification.setDesc(apt.getPatientName() + " with " + apt.getDoctorName());
            }
        }
        notification.setTimeLabel(shortDate(apt.getDate()));
    }

    private User findDoctorByName(List<User> doctorUsers, String name) {
        if (name == null) return null;
        for (User doctor : doctorUsers) {
            if (name.equals(doctor.getName())) return doctor;
        }
        return null;
    }

    private String contentKey(Notification notification) {
        return notification.getTitle() + "|" + notification.getDesc() + "|" + notification.getTimeLabel();
    }

    private String key(String email, Long appointmentId) {
        return email + "|" + appointmentId;
    }

    private String shortDate(String date) {
        return date.replaceAll(",\\s*\\d{4}$", "");
    }

    private record Desired(User user, Appointment appointment) {}
}
