package com.mysked.controller;

import com.mysked.entity.Student;
import com.mysked.exception.ResourceNotFoundException;
import com.mysked.repository.*;
import com.mysked.service.RecommendationEngineService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class WorkspaceController {
    private final StudentRepository studentRepo;
    private final SubjectRepository subjectRepo;
    private final TaskRepository taskRepo;
    private final StudySessionRepository sessionRepo;
    private final ExamRepository examRepo;
    private final SyllabusRepository syllabusRepo;
    private final GoalRepository goalRepo;
    private final HabitRepository habitRepo;
    private final NoteRepository noteRepo;
    private final MarkRepository markRepo;
    private final ReminderRepository reminderRepo;
    private final NotificationRepository notificationRepo;
    private final RecommendationEngineService recommendationService;

    public WorkspaceController(
            StudentRepository studentRepo,
            SubjectRepository subjectRepo,
            TaskRepository taskRepo,
            StudySessionRepository sessionRepo,
            ExamRepository examRepo,
            SyllabusRepository syllabusRepo,
            GoalRepository goalRepo,
            HabitRepository habitRepo,
            NoteRepository noteRepo,
            MarkRepository markRepo,
            ReminderRepository reminderRepo,
            NotificationRepository notificationRepo,
            RecommendationEngineService recommendationService) {
        this.studentRepo = studentRepo;
        this.subjectRepo = subjectRepo;
        this.taskRepo = taskRepo;
        this.sessionRepo = sessionRepo;
        this.examRepo = examRepo;
        this.syllabusRepo = syllabusRepo;
        this.goalRepo = goalRepo;
        this.habitRepo = habitRepo;
        this.noteRepo = noteRepo;
        this.markRepo = markRepo;
        this.reminderRepo = reminderRepo;
        this.notificationRepo = notificationRepo;
        this.recommendationService = recommendationService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "mysked-spring-boot");
    }

    @GetMapping("/workspace")
    public Map<String, Object> workspace(Authentication auth) {
        String sid = auth.getName();
        Student s = studentRepo.findById(sid).orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        return Map.ofEntries(
                Map.entry("student", s),
                Map.entry("subjects", subjectRepo.findByStudentId(sid)),
                Map.entry("tasks", taskRepo.findByStudentId(sid)),
                Map.entry("studySessions", sessionRepo.findByStudentId(sid)),
                Map.entry("exams", examRepo.findByStudentId(sid)),
                Map.entry("syllabus", syllabusRepo.findByStudentId(sid)),
                Map.entry("goals", goalRepo.findByStudentId(sid)),
                Map.entry("habits", habitRepo.findByStudentId(sid)),
                Map.entry("notes", noteRepo.findByStudentId(sid)),
                Map.entry("marks", markRepo.findByStudentId(sid)),
                Map.entry("reminders", reminderRepo.findByStudentId(sid)),
                Map.entry("notifications", notificationRepo.findByStudentIdOrderByCreatedAtDesc(sid)),
                Map.entry("recommendations", recommendationService.evaluateRules(sid))
        );
    }

    @GetMapping("/recommendations")
    public Map<String, Object> recommendations(Authentication auth) {
        return Map.of("recommendations", recommendationService.evaluateRules(auth.getName()));
    }
}
