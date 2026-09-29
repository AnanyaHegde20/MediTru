package com.meditru.service;

import com.meditru.dto.AuthResponse;
import com.meditru.dto.AuthUser;
import com.meditru.dto.ChangePasswordRequest;
import com.meditru.dto.LoginRequest;
import com.meditru.dto.RegisterRequest;
import com.meditru.dto.UpdateProfileRequest;
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
        String requestedRole = request.role() == null ? "patient" : request.role().trim();
        if (!requestedRole.equalsIgnoreCase("patient")) {
            throw new IllegalArgumentException(
                    "Only patients can self-register; doctor and admin accounts are created by an administrator");
        }
        User user = new User(request.name().trim(), email, passwordEncoder.encode(request.password()),
                User.UserRole.patient);
        users.save(user);
        return buildResponse(user);
    }

    public AuthUser currentUser(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Not authenticated"));
        return toAuthUser(user);
    }

    public AuthUser updateProfile(String email, UpdateProfileRequest request) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Not authenticated"));
        if (request == null) {
            throw new IllegalArgumentException("Invalid profile data");
        }
        if (request.name() != null) {
            if (request.name().isBlank()) {
                throw new IllegalArgumentException("Name cannot be empty");
            }
            user.setName(request.name().trim());
        }
        if (request.phone() != null) user.setPhone(request.phone().trim());
        if (request.avatar() != null) user.setAvatar(request.avatar().trim());
        if (request.badge() != null) user.setBadge(request.badge().trim());
        if (request.age() != null) {
            if (request.age() < 0 || request.age() > 150) {
                throw new IllegalArgumentException("Age must be between 0 and 150");
            }
            user.setAge(request.age());
        }
        if (request.gender() != null) user.setGender(request.gender().trim());
        if (request.bloodGroup() != null) user.setBloodGroup(request.bloodGroup().trim());
        if (request.allergies() != null) {
            user.setAllergies(String.join(", ", request.allergies()));
        }
        if (request.medicalCondition() != null) {
            user.setMedicalCondition(request.medicalCondition().trim());
        }
        users.save(user);
        return toAuthUser(user);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        if (request == null || request.currentPassword() == null || request.currentPassword().isBlank()
                || request.newPassword() == null || request.newPassword().isBlank()) {
            throw new IllegalArgumentException("Current and new password are required");
        }
        User user = users.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Not authenticated"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (request.newPassword().length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters");
        }
        if (request.newPassword().equals(request.currentPassword())) {
            throw new IllegalArgumentException("New password must differ from the current password");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        users.save(user);
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
