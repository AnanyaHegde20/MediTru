package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.dto.CreateThreadRequest;
import com.meditru.dto.MessageResponse;
import com.meditru.dto.MessageThreadResponse;
import com.meditru.dto.SendMessageRequest;
import com.meditru.service.AuthService;
import com.meditru.service.MessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService service;
    private final AuthService authService;

    public MessageController(MessageService service, AuthService authService) {
        this.service = service;
        this.authService = authService;
    }

    @GetMapping("/threads")
    public ResponseEntity<?> list(Authentication authentication) {
        try {
            return ResponseEntity.ok(service.listThreads(requireActor(authentication)));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/threads/{id}")
    public ResponseEntity<?> get(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(service.getThread(id, requireActor(authentication)));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/threads")
    public ResponseEntity<?> create(@RequestBody CreateThreadRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(service.createThread(request, requireActor(authentication)));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/threads/{id}/messages")
    public ResponseEntity<?> send(@PathVariable Long id, @RequestBody SendMessageRequest request,
                                  Authentication authentication) {
        try {
            String text = request == null ? null : request.text();
            MessageResponse message = service.sendMessage(id, text, requireActor(authentication));
            return ResponseEntity.ok(message);
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
