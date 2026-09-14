package com.meditru.repository;

import com.meditru.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientIdOrderByStartDateDesc(String patientId);
    List<Prescription> findByDoctorName(String doctorName);
}
