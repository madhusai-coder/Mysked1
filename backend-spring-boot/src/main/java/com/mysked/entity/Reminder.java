package com.mysked.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminders")
public class Reminder {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "remind_at", nullable = false)
    private LocalDateTime remindAt;

    @Column(name = "lead_minutes", nullable = false)
    private int leadMinutes = 30;

    @Column(name = "linked_type", nullable = false, length = 24)
    private String linkedType = "Custom";

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDateTime getRemindAt() { return remindAt; }
    public void setRemindAt(LocalDateTime remindAt) { this.remindAt = remindAt; }
    public int getLeadMinutes() { return leadMinutes; }
    public void setLeadMinutes(int leadMinutes) { this.leadMinutes = leadMinutes; }
    public String getLinkedType() { return linkedType; }
    public void setLinkedType(String linkedType) { this.linkedType = linkedType; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
}
