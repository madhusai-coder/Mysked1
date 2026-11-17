package com.mysked.controller;

import com.mysked.entity.StudySession;
import com.mysked.exception.ResourceNotFoundException;
import com.mysked.repository.StudySessionRepository;
import com.mysked.service.TimetableGeneratorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class StudyPlannerController {
    private final StudySessionRepository sessionRepo;
    private final TimetableGeneratorService timetableService;

    public StudyPlannerController(StudySessionRepository sessionRepo, TimetableGeneratorService timetableService) {
        this.sessionRepo = sessionRepo;
        this.timetableService = timetableService;
    }

    @PostMapping
    public ResponseEntity<StudySession> create(@RequestBody StudySession req, Authentication auth) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new IllegalArgumentException("Session title is required.");
        }
        req.setId("ses-" + UUID.randomUUID().toString().substring(0, 8));
        req.setStudentId(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionRepo.save(req));
    }

    @PutMapping("/{id}")
    public StudySession update(@PathVariable String id, @RequestBody StudySession req, Authentication auth) {
        StudySession existing = sessionRepo.findByIdAndStudentId(id, auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found."));
        if (req.getTitle() != null && !req.getTitle().isBlank()) existing.setTitle(req.getTitle().trim());
        if (req.getStatus() != null) existing.setStatus(req.getStatus());
        existing.setDayOfWeek(req.getDayOfWeek());
        if (req.getStartTime() != null) existing.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) existing.setEndTime(req.getEndTime());
        return sessionRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable String id, Authentication auth) {
        StudySession existing = sessionRepo.findByIdAndStudentId(id, auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found."));
        sessionRepo.delete(existing);
        return Map.of("deletedId", id);
    }

    @PostMapping("/auto-generate")
    public ResponseEntity<Map<String, Object>> autoGenerate(Authentication auth) {
        List<StudySession> generated = timetableService.autoGenerate(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("generatedCount", generated.size(), "sessions", generated));
    }
}
