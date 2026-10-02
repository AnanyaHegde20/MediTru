package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.service.AuthService;
import com.meditru.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;
    private final AuthService authService;

    public NotificationController(NotificationService service, AuthService authService) {
        this.service = service;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            return ResponseEntity.ok(service.listFor(actor.email()));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            service.markAllRead(actor.email());
            return ResponseEntity.ok(Map.of("message", "All notifications marked read"));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
    }

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
