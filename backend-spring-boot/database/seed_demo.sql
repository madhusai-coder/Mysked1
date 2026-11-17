-- Clearly Labeled Demo Student Seed Data for MySked
USE mysked_db;

INSERT IGNORE INTO students (
    id, name, email, password_hash, university, major, semester,
    daily_study_target_hours, weekly_study_target_hours, timezone, theme_preference, is_demo
) VALUES (
    'stu-demo-001',
    'Aarav Sharma (Demo Student)',
    'demo@mysked.app',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Institute of Technology',
    'B.Tech Computer Science',
    'Semester 5',
    4,
    25,
    'Asia/Kolkata',
    'dark',
    TRUE
);

INSERT IGNORE INTO subjects (id, student_id, name, code, color, weekly_target_hours, logged_hours, instructor) VALUES
('sub-dsa', 'stu-demo-001', 'Data Structures & Algorithms', 'CS301', '#22d3ee', 8.00, 6.50, 'Dr. Kavita Rao'),
('sub-dbms', 'stu-demo-001', 'Database Management Systems', 'CS304', '#a855f7', 6.00, 4.50, 'Prof. Arjun Mehta'),
('sub-os', 'stu-demo-001', 'Operating Systems', 'CS302', '#3b82f6', 6.00, 3.00, 'Dr. Elena Rostova'),
('sub-math', 'stu-demo-001', 'Discrete Mathematics', 'MA205', '#10b981', 5.00, 5.00, 'Prof. Vikram Sen');

INSERT IGNORE INTO exams (id, student_id, subject_id, title, exam_type, exam_date, location, target_score, notes) VALUES
('exm-1', 'stu-demo-001', 'sub-dsa', 'CS301 Mid-Semester Examination', 'Mid-Sem', DATE_ADD(NOW(), INTERVAL 6 DAY), 'Main Academic Block Hall 204', 90, 'Balanced trees and graph algorithms'),
('exm-2', 'stu-demo-001', 'sub-dbms', 'CS304 CLA-2 Assessment', 'CLA', DATE_ADD(NOW(), INTERVAL 11 DAY), 'CS Lab 3', 88, 'SQL joins and normalization');

INSERT IGNORE INTO syllabus (id, student_id, exam_id, subject_id, topic_title, unit_name, completed, estimated_hours) VALUES
('syl-1', 'stu-demo-001', 'exm-1', 'sub-dsa', 'AVL & Red-Black Trees', 'Unit 2', TRUE, 3.00),
('syl-2', 'stu-demo-001', 'exm-1', 'sub-dsa', 'Dijkstra & Bellman-Ford Shortest Paths', 'Unit 3', FALSE, 2.50),
('syl-3', 'stu-demo-001', 'exm-2', 'sub-dbms', 'Functional Dependencies & BCNF', 'Unit 2', TRUE, 2.00);
