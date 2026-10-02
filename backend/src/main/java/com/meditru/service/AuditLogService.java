package com.meditru.service;

import com.meditru.entity.AuditLog;
import com.meditru.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository repo;

    public AuditLogService(AuditLogRepository repo) {
        this.repo = repo;
    }

    public void record(String actorEmail, String actorRole, String action,
                       String targetType, String targetId, String detail) {
        try {
            AuditLog entry = new AuditLog();
            entry.setCreatedAt(Instant.now());
            entry.setActorEmail(actorEmail);
            entry.setActorRole(actorRole == null || actorRole.isBlank() ? "-" : actorRole);
            entry.setAction(action);
            entry.setTargetType(targetType);
            entry.setTargetId(targetId);
            entry.setDetail(detail);
            repo.save(entry);
        } catch (Exception e) {
            log.warn("[MediTru] Failed to write audit log entry {}: {}", action, e.getMessage());
        }
    }
}
