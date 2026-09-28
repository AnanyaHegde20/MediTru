package com.meditru.repository;

import com.meditru.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByThreadIdOrderByIdAsc(Long threadId);
}
