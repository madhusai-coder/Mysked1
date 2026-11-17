package com.mysked.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "students")
public class Student {
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    private String university = "";
    private String major = "";
    private String semester = "Semester 1";

    @Column(name = "daily_study_target_hours", nullable = false)
    private int dailyStudyTargetHours = 4;

    @Column(name = "weekly_study_target_hours", nullable = false)
    private int weeklyStudyTargetHours = 24;

    @Column(nullable = false, length = 64)
    private String timezone = "UTC";

    @Column(name = "theme_preference", nullable = false, length = 16)
    private String themePreference = "dark";

    @Column(name = "default_reminder_minutes", nullable = false)
    private int defaultReminderMinutes = 30;

    @Column(name = "notifications_enabled", nullable = false)
    private boolean notificationsEnabled = true;

    @Column(name = "is_demo", nullable = false)
    private boolean isDemo = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public int getDailyStudyTargetHours() { return dailyStudyTargetHours; }
    public void setDailyStudyTargetHours(int dailyStudyTargetHours) { this.dailyStudyTargetHours = dailyStudyTargetHours; }
    public int getWeeklyStudyTargetHours() { return weeklyStudyTargetHours; }
    public void setWeeklyStudyTargetHours(int weeklyStudyTargetHours) { this.weeklyStudyTargetHours = weeklyStudyTargetHours; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public String getThemePreference() { return themePreference; }
    public void setThemePreference(String themePreference) { this.themePreference = themePreference; }
    public int getDefaultReminderMinutes() { return defaultReminderMinutes; }
    public void setDefaultReminderMinutes(int defaultReminderMinutes) { this.defaultReminderMinutes = defaultReminderMinutes; }
    public boolean isNotificationsEnabled() { return notificationsEnabled; }
    public void setNotificationsEnabled(boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }
    public boolean isDemo() { return isDemo; }
    public void setDemo(boolean demo) { isDemo = demo; }
    public Instant getCreatedAt() { return createdAt; }
}
