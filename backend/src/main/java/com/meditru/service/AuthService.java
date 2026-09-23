package com.meditru.service;

import com.meditru.dto.AuthResponse;
import com.meditru.dto.AuthUser;
import com.meditru.dto.LoginRequest;
import com.meditru.dto.RegisterRequest;
import com.meditru.entity.User;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Email and password are required");
        }
        User user = users.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        return buildResponse(user);
    }

    public AuthResponse register(RegisterRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().length() < 6) {
            throw new IllegalArgumentException("Name, email and a password of at least 6 characters are required");
        }
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        User.UserRole role;
        try {
            role = User.UserRole.valueOf(request.role() == null ? "patient" : request.role());
        } catch (IllegalArgumentException e) {
            role = User.UserRole.patient;
        }
        User user = new User(request.name().trim(), email, passwordEncoder.encode(request.password()), role);
        users.save(user);
        return buildResponse(user);
    }

    public AuthUser currentUser(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Not authenticated"));
        return toAuthUser(user);
    }

    private AuthResponse buildResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), toAuthUser(user));
    }

    private AuthUser toAuthUser(User user) {
        List<String> allergies = user.getAllergies() == null || user.getAllergies().isBlank()
                ? List.of()
                : Arrays.stream(user.getAllergies().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        return new AuthUser(
                String.valueOf(user.getId()),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getAvatar(),
                user.getBadge(),
                user.getAge(),
                user.getGender(),
                user.getBloodGroup(),
                user.getPhone(),
                allergies,
                user.getMedicalCondition()
        );
    }

    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }
}
