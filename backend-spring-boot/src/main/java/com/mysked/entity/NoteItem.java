package com.mysked.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notes")
public class NoteItem {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;

    @Column(name = "subject_id", length = 36)
    private String subjectId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String content = "";

    @Column(name = "tags_csv")
    private String tagsCsv = "";

    @Column(name = "attachment_name")
    private String attachmentName;

    @Lob
    @Column(name = "attachment_data", columnDefinition = "LONGBLOB")
    private byte[] attachmentData;

    @Column(name = "attachment_size")
    private Long attachmentSize;

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
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTagsCsv() { return tagsCsv; }
    public void setTagsCsv(String tagsCsv) { this.tagsCsv = tagsCsv; }
    public String getAttachmentName() { return attachmentName; }
    public void setAttachmentName(String attachmentName) { this.attachmentName = attachmentName; }
    public byte[] getAttachmentData() { return attachmentData; }
    public void setAttachmentData(byte[] attachmentData) { this.attachmentData = attachmentData; }
    public Long getAttachmentSize() { return attachmentSize; }
    public void setAttachmentSize(Long attachmentSize) { this.attachmentSize = attachmentSize; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
