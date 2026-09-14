package com.meditru.repository;

import com.meditru.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdOrderByDateDesc(String patientId);
    List<Appointment> findByDoctorIdOrderByDateDesc(String doctorId);
    long countByStatus(String status);
}
