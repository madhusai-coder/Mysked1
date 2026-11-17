package com.mysked.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "marks")
public class MarkRecord {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(name = "subject_id", length = 36)
    private String subjectId;

    @Column(name = "exam_type", nullable = false, length = 24)
    private String examType = "CLA";

    @Column(name = "assessment_name", nullable = false, length = 200)
    private String assessmentName;

    @Column(name = "obtained_marks", nullable = false)
    private BigDecimal obtainedMarks;

    @Column(name = "max_marks", nullable = false)
    private BigDecimal maxMarks;

    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate = LocalDate.now();

    @Column(name = "semester_label", length = 40)
    private String semesterLabel = "Current Sem";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }
    public String getAssessmentName() { return assessmentName; }
    public void setAssessmentName(String assessmentName) { this.assessmentName = assessmentName; }
    public BigDecimal getObtainedMarks() { return obtainedMarks; }
    public void setObtainedMarks(BigDecimal obtainedMarks) { this.obtainedMarks = obtainedMarks; }
    public BigDecimal getMaxMarks() { return maxMarks; }
    public void setMaxMarks(BigDecimal maxMarks) { this.maxMarks = maxMarks; }
    public LocalDate getRecordedDate() { return recordedDate; }
    public void setRecordedDate(LocalDate recordedDate) { this.recordedDate = recordedDate; }
    public String getSemesterLabel() { return semesterLabel; }
    public void setSemesterLabel(String semesterLabel) { this.semesterLabel = semesterLabel; }
    public Instant getCreatedAt() { return createdAt; }
}
