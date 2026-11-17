package com.mysked.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "habits")
public class Habit {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 16)
    private String frequency = "Daily";

    @Column(name = "current_streak", nullable = false)
    private int currentStreak = 0;

    @Column(name = "best_streak", nullable = false)
    private int bestStreak = 0;

    @Column(name = "completed_dates_json", nullable = false, columnDefinition = "TEXT")
    private String completedDatesJson = "[]";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public int getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
    public int getBestStreak() { return bestStreak; }
    public void setBestStreak(int bestStreak) { this.bestStreak = bestStreak; }
    public String getCompletedDatesJson() { return completedDatesJson; }
    public void setCompletedDatesJson(String completedDatesJson) { this.completedDatesJson = completedDatesJson; }
    public Instant getCreatedAt() { return createdAt; }
}
