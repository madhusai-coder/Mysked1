package com.mysked.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "syllabus")
public class SyllabusItem {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(name = "exam_id", nullable = false, length = 36)
    private String examId;

    @Column(name = "subject_id", length = 36)
    private String subjectId;

    @Column(name = "topic_title", nullable = false, length = 200)
    private String topicTitle;

    @Column(name = "unit_name", nullable = false, length = 64)
    private String unitName = "Unit 1";

    @Column(nullable = false)
    private boolean completed = false;

    @Column(name = "estimated_hours", nullable = false)
    private BigDecimal estimatedHours = BigDecimal.valueOf(2);

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getTopicTitle() { return topicTitle; }
    public void setTopicTitle(String topicTitle) { this.topicTitle = topicTitle; }
    public String getUnitName() { return unitName; }
    public void setUnitName(String unitName) { this.unitName = unitName; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public BigDecimal getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(BigDecimal estimatedHours) { this.estimatedHours = estimatedHours; }
    public Instant getCreatedAt() { return createdAt; }
}
