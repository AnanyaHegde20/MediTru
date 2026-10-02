package com.meditru.repository;

import com.meditru.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByEmailOrderByCreatedAtDesc(String email);
}
