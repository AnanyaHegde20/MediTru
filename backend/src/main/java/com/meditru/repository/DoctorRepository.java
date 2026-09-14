package com.meditru.repository;

import com.meditru.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findBySpecialtyContainingIgnoreCase(String specialty);
    List<Doctor> findByNameContainingIgnoreCase(String name);
}
