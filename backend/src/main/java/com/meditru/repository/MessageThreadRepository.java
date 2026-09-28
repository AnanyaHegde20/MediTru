package com.meditru.repository;

import com.meditru.entity.MessageThread;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageThreadRepository extends JpaRepository<MessageThread, Long> {
}
