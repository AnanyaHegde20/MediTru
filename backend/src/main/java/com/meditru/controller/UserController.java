package com.meditru.controller;

import com.meditru.dto.PageEnvelope;
import com.meditru.dto.ResetPasswordRequest;
import com.meditru.entity.User;
import com.meditru.service.UserService;
import com.meditru.util.Csv;
import com.meditru.util.Filters;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) Integer page,
                                  @RequestParam(required = false) Integer size,
                                  @RequestParam(required = false) String q) {
        List<User> filtered = service.findAll().stream()
                .filter(u -> Filters.matches(q, u.getName(), u.getEmail(),
                        u.getRole() != null ? u.getRole().name() : null))
                .toList();
        if (page == null) {
            return ResponseEntity.ok(filtered);
        }
        Map<String, Long> facets = Map.of(
                "admin", service.countByRole(User.UserRole.admin),
                "doctor", service.countByRole(User.UserRole.doctor),
                "patient", service.countByRole(User.UserRole.patient));
        return ResponseEntity.ok(PageEnvelope.of(filtered, page, size == null ? 10 : size, facets));
    }

    @GetMapping(value = "/export", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<String> exportCsv() {
        StringBuilder csv = new StringBuilder();
        csv.append(Csv.row("ID", "Name", "Email", "Role", "Phone", "Age", "Gender", "Blood Group"));
        for (User user : service.findAll()) {
            csv.append(Csv.row(
                    String.valueOf(user.getId()),
                    user.getName(),
                    user.getEmail(),
                    user.getRole() != null ? user.getRole().name() : "",
                    user.getPhone(),
                    user.getAge() != null ? String.valueOf(user.getAge()) : "",
                    user.getGender(),
                    user.getBloodGroup()));
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users.csv\"")
                .body(csv.toString());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable Long id) {
        User user = service.findById(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<User> getByEmail(@PathVariable String email) {
        User user = service.findByEmail(email);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody User user) {
        try {
            return ResponseEntity.ok(service.create(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody User user) {
        try {
            return ResponseEntity.ok(service.update(id, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody ResetPasswordRequest request) {
        if (service.findById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        try {
            service.resetPassword(id, request.password());
            return ResponseEntity.ok(Map.of("message", "Password reset"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
