-- MySked Normalized MySQL 8 Schema
-- Includes all 12 normalized tables with primary keys, foreign keys, indexes, timestamps, and per-student ownership

CREATE DATABASE IF NOT EXISTS mysked_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mysked_db;

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    university VARCHAR(160) DEFAULT '',
    major VARCHAR(120) DEFAULT '',
    semester VARCHAR(60) DEFAULT 'Semester 1',
    daily_study_target_hours INT NOT NULL DEFAULT 4,
    weekly_study_target_hours INT NOT NULL DEFAULT 24,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    theme_preference VARCHAR(16) NOT NULL DEFAULT 'dark',
    default_reminder_minutes INT NOT NULL DEFAULT 30,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    name VARCHAR(140) NOT NULL,
    code VARCHAR(32) NOT NULL,
    color VARCHAR(16) NOT NULL DEFAULT '#22d3ee',
    weekly_target_hours DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    logged_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    instructor VARCHAR(120) DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subjects_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_subjects_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('Assignment', 'Homework', 'Project', 'Revision') NOT NULL DEFAULT 'Assignment',
    priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    status ENUM('Todo', 'In Progress', 'Completed') NOT NULL DEFAULT 'Todo',
    progress INT NOT NULL DEFAULT 0,
    due_date DATETIME NOT NULL,
    estimated_minutes INT NOT NULL DEFAULT 60,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_tasks_student_status (student_id, status),
    INDEX idx_tasks_student_due (student_id, due_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS study_sessions (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NULL,
    title VARCHAR(200) NOT NULL,
    day_of_week TINYINT NOT NULL,
    session_date DATE NOT NULL,
    start_time VARCHAR(8) NOT NULL,
    end_time VARCHAR(8) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    recurring ENUM('None', 'Daily', 'Weekly') NOT NULL DEFAULT 'None',
    status ENUM('Scheduled', 'Completed', 'Missed') NOT NULL DEFAULT 'Scheduled',
    is_focus_log BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_sessions_student_day (student_id, day_of_week),
    INDEX idx_sessions_student_date (student_id, session_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NULL,
    title VARCHAR(200) NOT NULL,
    exam_type ENUM('CLA', 'Mid-Sem', 'End-Sem', 'Quiz') NOT NULL DEFAULT 'Mid-Sem',
    exam_date DATETIME NOT NULL,
    location VARCHAR(160) DEFAULT '',
    target_score INT NOT NULL DEFAULT 85,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exams_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_exams_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_exams_student_date (student_id, exam_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS syllabus (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    exam_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NULL,
    topic_title VARCHAR(200) NOT NULL,
    unit_name VARCHAR(64) NOT NULL DEFAULT 'Unit 1',
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_hours DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_syllabus_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_syllabus_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_syllabus_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_syllabus_exam (student_id, exam_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS goals (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NULL,
    title VARCHAR(200) NOT NULL,
    target_value INT NOT NULL,
    current_value INT NOT NULL DEFAULT 0,
    unit VARCHAR(40) NOT NULL DEFAULT 'units',
    deadline DATETIME NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_goals_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_goals_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_goals_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS habits (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    name VARCHAR(160) NOT NULL,
    frequency ENUM('Daily', 'Weekdays') NOT NULL DEFAULT 'Daily',
    current_streak INT NOT NULL DEFAULT 0,
    best_streak INT NOT NULL DEFAULT 0,
    completed_dates_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_habits_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_habits_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NULL,
    title VARCHAR(200) NOT NULL,
    content LONGTEXT,
    tags_csv VARCHAR(255) DEFAULT '',
    attachment_name VARCHAR(255) NULL,
    attachment_data LONGBLOB NULL,
    attachment_size BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notes_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_notes_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_notes_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marks (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NULL,
    exam_type ENUM('CLA', 'Mid-Sem', 'End-Sem', 'Assignment') NOT NULL DEFAULT 'CLA',
    assessment_name VARCHAR(200) NOT NULL,
    obtained_marks DECIMAL(6,2) NOT NULL,
    max_marks DECIMAL(6,2) NOT NULL,
    recorded_date DATE NOT NULL,
    semester_label VARCHAR(40) DEFAULT 'Current Sem',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_marks_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_marks_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_marks_student_subject (student_id, subject_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    remind_at DATETIME NOT NULL,
    lead_minutes INT NOT NULL DEFAULT 30,
    linked_type ENUM('Task', 'Exam', 'Session', 'Custom') NOT NULL DEFAULT 'Custom',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminders_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_reminders_student_time (student_id, remind_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Deadline', 'Exam', 'Streak', 'Reminder', 'System') NOT NULL DEFAULT 'System',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_notifications_student_read (student_id, is_read)
) ENGINE=InnoDB;
