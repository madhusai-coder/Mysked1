package com.mysked.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "goals")
public class Goal {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(name = "subject_id", length = 36)
    private String subjectId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "target_value", nullable = false)
    private int targetValue = 10;

    @Column(name = "current_value", nullable = false)
    private int currentValue = 0;

    @Column(nullable = false, length = 40)
    private String unit = "units";

    @Column(nullable = false)
    private LocalDateTime deadline = LocalDateTime.now().plusDays(14);

    @Column(nullable = false)
    private boolean completed = false;

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
    public int getTargetValue() { return targetValue; }
    public void setTargetValue(int targetValue) { this.targetValue = targetValue; }
    public int getCurrentValue() { return currentValue; }
    public void setCurrentValue(int currentValue) { this.currentValue = currentValue; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Instant getCreatedAt() { return createdAt; }
}
