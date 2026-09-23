package com.meditru.service;

import com.meditru.entity.User;
import com.meditru.entity.User.UserRole;
import com.meditru.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repo, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() { return repo.findAll(); }

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
        if (updated.getName() != null) user.setName(updated.getName());
        if (updated.getEmail() != null) user.setEmail(updated.getEmail());
        if (updated.getAvatar() != null) user.setAvatar(updated.getAvatar());
        if (updated.getBadge() != null) user.setBadge(updated.getBadge());
        if (updated.getAge() != null) user.setAge(updated.getAge());
        if (updated.getGender() != null) user.setGender(updated.getGender());
        if (updated.getBloodGroup() != null) user.setBloodGroup(updated.getBloodGroup());
        if (updated.getPhone() != null) user.setPhone(updated.getPhone());
        if (updated.getAllergies() != null) user.setAllergies(updated.getAllergies());
        if (updated.getMedicalCondition() != null) user.setMedicalCondition(updated.getMedicalCondition());
        return repo.save(user);
    }

    public void delete(Long id) { repo.deleteById(id); }

    public long countByRole(UserRole role) { return repo.countByRole(role); }
}
