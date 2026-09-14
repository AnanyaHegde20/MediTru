package com.meditru.repository;

import com.meditru.entity.PatientQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientQueueRepository extends JpaRepository<PatientQueue, Long> {
    List<PatientQueue> findByDoctorId(String doctorId);
}
