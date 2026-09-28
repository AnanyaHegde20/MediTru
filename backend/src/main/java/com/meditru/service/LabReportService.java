package com.meditru.service;

import com.meditru.config.MeditruProperties;
import com.meditru.entity.LabReport;
import com.meditru.repository.LabReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class LabReportService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "png", "jpg", "jpeg");
    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "pdf", "application/pdf",
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg"
    );
    public static final long MAX_FILE_BYTES = 25L * 1024 * 1024;

    private final LabReportRepository repo;
    private final Path storageDir;

    public LabReportService(LabReportRepository repo, MeditruProperties properties) {
        this.repo = repo;
        this.storageDir = Path.of(properties.getStorageDir());
    }

    public List<LabReport> findAll() { return repo.findAll(); }

    public LabReport findById(Long id) { return repo.findById(id).orElse(null); }

    public List<LabReport> findByPatient(String patientId) {
        return repo.findByPatientIdOrderByDateDesc(patientId);
    }

    public LabReport create(LabReport report) { return repo.save(report); }

    public LabReport upload(MultipartFile file, LabReport metadata) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A file is required");
        }
        if (metadata == null || metadata.getPatientId() == null || metadata.getPatientId().isBlank()
                || metadata.getName() == null || metadata.getName().isBlank()) {
            throw new IllegalArgumentException("Patient id and report name are required");
        }
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file type: " + extension
                    + " (allowed: pdf, png, jpg, jpeg)");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new IllegalArgumentException("File is too large (max 25 MB)");
        }

        LabReport report = metadata;
        String storedName = UUID.randomUUID() + "." + extension;
        try {
            Files.createDirectories(storageDir);
            Files.copy(file.getInputStream(), storageDir.resolve(storedName),
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store the uploaded file", e);
        }

        report.setFileName(storedName);
        report.setContentType(CONTENT_TYPES.get(extension));
        report.setSizeBytes(file.getSize());
        report.setFileSize(formatSize(file.getSize()));
        report = repo.save(report);
        report.setDownloadUrl("/api/lab-reports/" + report.getId() + "/file");
        return repo.save(report);
    }

    public Path resolveFile(LabReport report) {
        if (report == null || report.getFileName() == null || report.getFileName().isBlank()) {
            return null;
        }
        Path path = storageDir.resolve(report.getFileName()).normalize();
        if (!path.startsWith(storageDir.normalize())) {
            return null;
        }
        return Files.isRegularFile(path) ? path : null;
    }

    public void delete(Long id) {
        repo.findById(id).ifPresent(report -> {
            Path file = resolveFile(report);
            if (file != null) {
                try {
                    Files.deleteIfExists(file);
                } catch (IOException ignored) {
                    // best effort — report row is removed either way
                }
            }
            repo.deleteById(id);
        });
    }

    private String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) return "";
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    public static String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format(Locale.ROOT, "%.1f KB", bytes / 1024.0);
        return String.format(Locale.ROOT, "%.1f MB", bytes / (1024.0 * 1024.0));
    }
}
