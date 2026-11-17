package com.mysked.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "study_sessions")
public class StudySession {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(name = "subject_id", length = 36)
    private String subjectId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate = LocalDate.now();

    @Column(name = "start_time", nullable = false, length = 8)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 8)
    private String endTime;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes = 60;

    @Column(nullable = false, length = 16)
    private String recurring = "None";

    @Column(nullable = false, length = 16)
    private String status = "Scheduled";

    @Column(name = "is_focus_log", nullable = false)
    private boolean isFocusLog = false;

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
    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getRecurring() { return recurring; }
    public void setRecurring(String recurring) { this.recurring = recurring; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isFocusLog() { return isFocusLog; }
    public void setFocusLog(boolean focusLog) { isFocusLog = focusLog; }
    public Instant getCreatedAt() { return createdAt; }
}
