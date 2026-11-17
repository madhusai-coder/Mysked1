package com.mysked.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class TaskItem {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(name = "subject_id", length = 36)
    private String subjectId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description = "";

    @Column(nullable = false, length = 24)
    private String category = "Assignment";

    @Column(nullable = false, length = 16)
    private String priority = "Medium";

    @Column(nullable = false, length = 24)
    private String status = "Todo";

    @Column(nullable = false)
    private int progress = 0;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate = LocalDateTime.now().plusDays(2);

    @Column(name = "estimated_minutes", nullable = false)
    private int estimatedMinutes = 60;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public int getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
