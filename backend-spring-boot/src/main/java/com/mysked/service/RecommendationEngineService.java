package com.mysked.service;

import com.mysked.entity.*;
import com.mysked.repository.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class RecommendationEngineService {
    private final TaskRepository taskRepo;
    private final SubjectRepository subjectRepo;
    private final ExamRepository examRepo;
    private final SyllabusRepository syllabusRepo;

    public RecommendationEngineService(
            TaskRepository taskRepo,
            SubjectRepository subjectRepo,
            ExamRepository examRepo,
            SyllabusRepository syllabusRepo) {
        this.taskRepo = taskRepo;
        this.subjectRepo = subjectRepo;
        this.examRepo = examRepo;
        this.syllabusRepo = syllabusRepo;
    }

    public List<Map<String, String>> evaluateRules(String studentId) {
        List<Map<String, String>> recs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        List<TaskItem> activeTasks = taskRepo.findByStudentId(studentId).stream()
                .filter(t -> !"Completed".equalsIgnoreCase(t.getStatus()))
                .toList();

        // Rule 1: Overdue Tasks
        activeTasks.stream()
                .filter(t -> t.getDueDate().isBefore(now))
                .findFirst()
                .ifPresent(t -> recs.add(Map.of(
                        "id", "rec-overdue-" + t.getId(),
                        "title", "Prioritize overdue task: " + t.getTitle(),
                        "actionLabel", "Open Tasks",
                        "targetPage", "tasks",
                        "priority", "high",
                        "ruleCode", "RULE_OVERDUE_DEADLINE",
                        "explanation", "Rule triggered because \"" + t.getTitle() + "\" passed its due timestamp and sits at " + t.getProgress() + "% completion."
                )));

        // Rule 2: Upcoming Exam within 14 days with < 75% syllabus completion
        List<SyllabusItem> allTopics = syllabusRepo.findByStudentId(studentId);
        for (Exam exam : examRepo.findByStudentId(studentId)) {
            long daysLeft = Duration.between(now, exam.getExamDate()).toDays();
            if (daysLeft >= 0 && daysLeft <= 14) {
                List<SyllabusItem> topics = allTopics.stream().filter(s -> exam.getId().equals(s.getExamId())).toList();
                long done = topics.stream().filter(SyllabusItem::isCompleted).count();
                int pct = topics.isEmpty() ? 0 : (int) Math.round((done * 100.0) / topics.size());
                if (pct < 75) {
                    recs.add(Map.of(
                            "id", "rec-exam-" + exam.getId(),
                            "title", "Schedule revision blocks for " + exam.getTitle(),
                            "actionLabel", "Review Syllabus",
                            "targetPage", "exams",
                            "priority", daysLeft <= 7 ? "high" : "medium",
                            "ruleCode", "RULE_EXAM_SYLLABUS_GAP",
                            "explanation", "Rule triggered because " + exam.getExamType() + " exam is " + daysLeft + " day(s) away with " + pct + "% (" + done + "/" + topics.size() + ") syllabus checked off."
                    ));
                }
            }
        }

        // Rule 3: Subject Weekly Target Deficit
        subjectRepo.findByStudentId(studentId).stream()
                .filter(s -> s.getWeeklyTargetHours().doubleValue() > 0
                        && s.getLoggedHours().doubleValue() / s.getWeeklyTargetHours().doubleValue() < 0.65)
                .findFirst()
                .ifPresent(sub -> recs.add(Map.of(
                        "id", "rec-sub-" + sub.getId(),
                        "title", "Add a 90-min block for " + sub.getName(),
                        "actionLabel", "Plan Session",
                        "targetPage", "planner",
                        "priority", "medium",
                        "ruleCode", "RULE_WEEKLY_TARGET_DEFICIT",
                        "explanation", "Rule triggered because " + sub.getCode() + " has " + sub.getLoggedHours() + "h logged against its " + sub.getWeeklyTargetHours() + "h weekly target."
                )));

        return recs;
    }
}
