package com.mysked.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "subjects")
public class Subject {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, length = 32)
    private String code;

    @Column(nullable = false, length = 16)
    private String color = "#22d3ee";

    @Column(name = "weekly_target_hours", nullable = false)
    private BigDecimal weeklyTargetHours = BigDecimal.valueOf(5);

    @Column(name = "logged_hours", nullable = false)
    private BigDecimal loggedHours = BigDecimal.ZERO;

    private String instructor = "";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public BigDecimal getWeeklyTargetHours() { return weeklyTargetHours; }
    public void setWeeklyTargetHours(BigDecimal weeklyTargetHours) { this.weeklyTargetHours = weeklyTargetHours; }
    public BigDecimal getLoggedHours() { return loggedHours; }
    public void setLoggedHours(BigDecimal loggedHours) { this.loggedHours = loggedHours; }
    public String getInstructor() { return instructor; }
    public void setInstructor(String instructor) { this.instructor = instructor; }
    public Instant getCreatedAt() { return createdAt; }
}
