package com.meditru.controller;

import com.meditru.dto.PageEnvelope;
import com.meditru.entity.AuditLog;
import com.meditru.repository.AuditLogRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-log")
public class AuditLogController {

    private final AuditLogRepository repo;

    public AuditLogController(AuditLogRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) Integer page,
                                  @RequestParam(required = false) Integer size,
                                  @RequestParam(required = false) String action) {
        List<AuditLog> all = repo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AuditLog> filtered = all.stream()
                .filter(entry -> action == null || action.isBlank()
                        || action.equalsIgnoreCase(entry.getAction()))
                .toList();
        if (page == null) {
            return ResponseEntity.ok(filtered);
        }
        return ResponseEntity.ok(PageEnvelope.of(filtered, page, size == null ? 10 : size));
    }
}
