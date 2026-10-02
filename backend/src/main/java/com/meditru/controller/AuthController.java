package com.meditru.controller;

import com.meditru.dto.AuthResponse;
import com.meditru.dto.AuthUser;
import com.meditru.dto.ChangePasswordRequest;
import com.meditru.dto.LoginRequest;
import com.meditru.dto.RegisterRequest;
import com.meditru.dto.UpdateProfileRequest;
import com.meditru.service.AuditLogService;
import com.meditru.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuditLogService auditLog;

    public AuthController(AuthService authService, AuditLogService auditLog) {
        this.authService = authService;
        this.auditLog = auditLog;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            auditLog.record(request.email(), response.user().role(), "LOGIN_SUCCESS",
                    "session", null, "Signed in");
            return ResponseEntity.ok(response);
        } catch (AuthService.UnauthorizedException e) {
            auditLog.record(request.email(), "-", "LOGIN_FAILED",
                    "session", null, "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            auditLog.record(request.email(), "patient", "REGISTERED",
                    "user", String.valueOf(response.user().id()), "Self-registered as patient");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        try {
            AuthUser user = authService.currentUser(authentication.getName());
            return ResponseEntity.ok(user);
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(Authentication authentication,
                                      @RequestBody UpdateProfileRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        try {
            return ResponseEntity.ok(authService.updateProfile(authentication.getName(), request));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        try {
            authService.revokeSessions(authentication.getName());
            return ResponseEntity.ok(Map.of("message", "Logged out"));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(Authentication authentication,
                                            @RequestBody ChangePasswordRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        try {
            authService.changePassword(authentication.getName(), request);
            return ResponseEntity.ok(Map.of("message", "Password updated"));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
