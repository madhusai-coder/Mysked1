package com.mysked.controller;

import com.mysked.entity.Student;
import com.mysked.exception.ResourceNotFoundException;
import com.mysked.repository.StudentRepository;
import com.mysked.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final StudentRepository studentRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(StudentRepository studentRepo, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.studentRepo = studentRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public record RegisterRequest(
            @NotBlank @Size(min = 2) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            String university,
            String major,
            String semester) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record ForgotRequest(@NotBlank @Email String email, @NotBlank @Size(min = 6) String newPassword) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (studentRepo.existsByEmailIgnoreCase(req.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "An account with this email already exists."));
        }
        Student s = new Student();
        s.setId("stu-" + UUID.randomUUID().toString().substring(0, 8));
        s.setName(req.name().trim());
        s.setEmail(req.email().trim().toLowerCase());
        s.setPasswordHash(passwordEncoder.encode(req.password()));
        s.setUniversity(req.university() != null ? req.university().trim() : "");
        s.setMajor(req.major() != null ? req.major().trim() : "");
        s.setSemester(req.semester() != null && !req.semester().isBlank() ? req.semester().trim() : "Semester 1");
        studentRepo.save(s);

        String token = jwtService.generateToken(s.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("token", token, "student", sanitize(s)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Student s = studentRepo.findByEmailIgnoreCase(req.email().trim())
                .orElse(null);
        if (s == null || !passwordEncoder.matches(req.password(), s.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }
        return ResponseEntity.ok(Map.of("token", jwtService.generateToken(s.getId()), "student", sanitize(s)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotRequest req) {
        Student s = studentRepo.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new ResourceNotFoundException("No account found for that email address."));
        if (s.isDemo()) {
            throw new IllegalArgumentException("The shared demo account password cannot be altered.");
        }
        s.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        studentRepo.save(s);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        Student s = studentRepo.findById(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        return Map.of("student", sanitize(s));
    }

    private Map<String, Object> sanitize(Student s) {
        return Map.ofEntries(
                Map.entry("id", s.getId()),
                Map.entry("name", s.getName()),
                Map.entry("email", s.getEmail()),
                Map.entry("university", s.getUniversity()),
                Map.entry("major", s.getMajor()),
                Map.entry("semester", s.getSemester()),
                Map.entry("dailyStudyTargetHours", s.getDailyStudyTargetHours()),
                Map.entry("weeklyStudyTargetHours", s.getWeeklyStudyTargetHours()),
                Map.entry("timezone", s.getTimezone()),
                Map.entry("themePreference", s.getThemePreference()),
                Map.entry("defaultReminderMinutes", s.getDefaultReminderMinutes()),
                Map.entry("notificationsEnabled", s.isNotificationsEnabled()),
                Map.entry("isDemo", s.isDemo())
        );
    }
}
