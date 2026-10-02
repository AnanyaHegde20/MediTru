package com.meditru.service;

import com.meditru.config.MeditruProperties;
import com.meditru.entity.Doctor;
import com.meditru.entity.User;
import com.meditru.entity.User.UserRole;
import com.meditru.repository.DoctorRepository;
import com.meditru.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class UserService {

    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of("png", "jpg", "jpeg", "webp");
    private static final long MAX_AVATAR_BYTES = 2L * 1024 * 1024;

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final MeditruProperties properties;
    private final DoctorRepository doctorRepository;

    public UserService(UserRepository repo, PasswordEncoder passwordEncoder,
                       MeditruProperties properties, DoctorRepository doctorRepository) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
        this.doctorRepository = doctorRepository;
    }

    public List<User> findAll() { return repo.findAll(); }

    public List<User> findPatients() { return repo.findByRoleOrderByNameAsc(UserRole.patient); }

    public User findById(Long id) { return repo.findById(id).orElse(null); }

    public User findByEmail(String email) { return repo.findByEmail(email).orElse(null); }

    public User create(User user) {
        if (repo.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (user.getPassword() != null && !user.getPassword().startsWith("{bcrypt}")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return repo.save(user);
    }

    public User update(Long id, User updated) {
        User user = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (updated.getEmail() != null && !updated.getEmail().equals(user.getEmail())) {
            if (repo.existsByEmail(updated.getEmail())) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(updated.getEmail());
        }
        if (updated.getName() != null) user.setName(updated.getName());
        if (updated.getAvatar() != null) user.setAvatar(updated.getAvatar());
        if (updated.getBadge() != null) user.setBadge(updated.getBadge());
        if (updated.getAge() != null) user.setAge(updated.getAge());
        if (updated.getGender() != null) user.setGender(updated.getGender());
        if (updated.getBloodGroup() != null) user.setBloodGroup(updated.getBloodGroup());
        if (updated.getPhone() != null) user.setPhone(updated.getPhone());
        if (updated.getAllergies() != null) user.setAllergies(updated.getAllergies());
        if (updated.getMedicalCondition() != null) user.setMedicalCondition(updated.getMedicalCondition());
        if (updated.getRole() != null) user.setRole(updated.getRole());
        return repo.save(user);
    }

    public void delete(Long id) { repo.deleteById(id); }

    public void resetPassword(Long id, String password) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        User user = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(passwordEncoder.encode(password));
        user.bumpTokenVersion();
        repo.save(user);
    }

    public long countByRole(UserRole role) { return repo.countByRole(role); }

    public User saveAvatar(Long id, MultipartFile file) {
        User user = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A file is required");
        }
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT)
                : "";
        if (!ALLOWED_AVATAR_TYPES.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file type: " + extension
                    + " (allowed: png, jpg, jpeg, webp)");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new IllegalArgumentException("File is too large (max 2 MB)");
        }

        Path avatarsDir = Path.of(properties.getStorageDir()).resolve("avatars");
        try {
            if (user.getAvatarFileName() != null && !user.getAvatarFileName().isBlank()) {
                Files.deleteIfExists(avatarsDir.resolve(user.getAvatarFileName()).normalize());
            }
            Files.createDirectories(avatarsDir);
            String storedName = UUID.randomUUID() + "." + extension;
            Files.copy(file.getInputStream(), avatarsDir.resolve(storedName),
                    StandardCopyOption.REPLACE_EXISTING);
            user.setAvatarFileName(storedName);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store the uploaded photo", e);
        }
        user.setAvatar("/api/users/" + id + "/avatar?v=" + System.currentTimeMillis());
        User saved = repo.save(user);

        Doctor doctor = doctorRepository.findByEmailIgnoreCase(saved.getEmail());
        if (doctor != null) {
            doctor.setAvatar(saved.getAvatar());
            doctorRepository.save(doctor);
        }
        return saved;
    }

    public Path resolveAvatarFile(Long id) {
        User user = repo.findById(id).orElse(null);
        if (user == null || user.getAvatarFileName() == null || user.getAvatarFileName().isBlank()) {
            return null;
        }
        Path avatarsDir = Path.of(properties.getStorageDir()).resolve("avatars").normalize();
        Path path = avatarsDir.resolve(user.getAvatarFileName()).normalize();
        if (!path.startsWith(avatarsDir)) {
            return null;
        }
        return Files.isRegularFile(path) ? path : null;
    }
}
