package com.mysked.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "exams")
public class Exam {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(name = "subject_id", length = 36)
    private String subjectId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "exam_type", nullable = false, length = 24)
    private String examType = "Mid-Sem";

    @Column(name = "exam_date", nullable = false)
    private LocalDateTime examDate;

    private String location = "";

    @Column(name = "target_score", nullable = false)
    private int targetScore = 85;

    @Column(columnDefinition = "TEXT")
    private String notes = "";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }
    public LocalDateTime getExamDate() { return examDate; }
    public void setExamDate(LocalDateTime examDate) { this.examDate = examDate; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public int getTargetScore() { return targetScore; }
    public void setTargetScore(int targetScore) { this.targetScore = targetScore; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
}
