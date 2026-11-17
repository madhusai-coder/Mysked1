import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type {
  AppNotification,
  Exam,
  Goal,
  Habit,
  MarkRecord,
  Note,
  Recommendation,
  Reminder,
  StudentProfile,
  StudySession,
  Subject,
  SyllabusTopic,
  Task,
} from './src/types.js';

interface StudentRow extends StudentProfile {
  passwordHash: string;
}

interface DatabaseSchema {
  students: StudentRow[];
  subjects: Subject[];
  tasks: Task[];
  studySessions: StudySession[];
  exams: Exam[];
  syllabus: SyllabusTopic[];
  goals: Goal[];
  habits: Habit[];
  notes: Note[];
  marks: MarkRecord[];
  reminders: Reminder[];
  notifications: AppNotification[];
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mysked-db.json');
const TOKEN_SECRET = process.env.SESSION_SECRET || 'mysked-runtime-dev-secret-2026';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function signToken(studentId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: studentId, iat: Date.now(), exp: Date.now() + 7 * 24 * 3600 * 1000 }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string | undefined): string | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof parsed.sub === 'string' && parsed.exp > Date.now()) {
      return parsed.sub;
    }
    return null;
  } catch {
    return null;
  }
}

function isoOffsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function dateOffsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function createInitialDatabase(): DatabaseSchema {
  const demoId = 'stu-demo-001';
  const now = new Date().toISOString();

  const subjects: Subject[] = [
    {
      id: 'sub-dsa',
      studentId: demoId,
      name: 'Data Structures & Algorithms',
      code: 'CS301',
      color: '#22d3ee',
      weeklyTargetHours: 8,
      loggedHours: 6.5,
      instructor: 'Dr. Kavita Rao',
      createdAt: now,
    },
    {
      id: 'sub-dbms',
      studentId: demoId,
      name: 'Database Management Systems',
      code: 'CS304',
      color: '#a855f7',
      weeklyTargetHours: 6,
      loggedHours: 4.5,
      instructor: 'Prof. Arjun Mehta',
      createdAt: now,
    },
    {
      id: 'sub-os',
      studentId: demoId,
      name: 'Operating Systems',
      code: 'CS302',
      color: '#3b82f6',
      weeklyTargetHours: 6,
      loggedHours: 3.0,
      instructor: 'Dr. Elena Rostova',
      createdAt: now,
    },
    {
      id: 'sub-math',
      studentId: demoId,
      name: 'Discrete Mathematics',
      code: 'MA205',
      color: '#10b981',
      weeklyTargetHours: 5,
      loggedHours: 5.0,
      instructor: 'Prof. Vikram Sen',
      createdAt: now,
    },
  ];

  const tasks: Task[] = [
    {
      id: 'tsk-1',
      studentId: demoId,
      subjectId: 'sub-dsa',
      title: 'Implement Red-Black Tree Insertion & Rotations',
      description: 'Complete Java implementation with unit tests for edge-case balancing.',
      category: 'Assignment',
      priority: 'Urgent',
      status: 'In Progress',
      progress: 65,
      dueDate: isoOffsetDays(1),
      estimatedMinutes: 120,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk-2',
      studentId: demoId,
      subjectId: 'sub-dbms',
      title: 'Normalize Library ER Diagram to BCNF',
      description: 'Document functional dependencies and write MySQL DDL scripts.',
      category: 'Homework',
      priority: 'High',
      status: 'Todo',
      progress: 20,
      dueDate: isoOffsetDays(2),
      estimatedMinutes: 90,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk-3',
      studentId: demoId,
      subjectId: 'sub-os',
      title: 'CPU Scheduling Simulator Report',
      description: 'Compare FCFS, SJF, and Round Robin turnaround metrics.',
      category: 'Project',
      priority: 'Medium',
      status: 'Todo',
      progress: 10,
      dueDate: isoOffsetDays(5),
      estimatedMinutes: 150,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk-4',
      studentId: demoId,
      subjectId: 'sub-math',
      title: 'Graph Theory Problem Set 4',
      description: 'Solved Eulerian circuits and planar graph proofs.',
      category: 'Homework',
      priority: 'Medium',
      status: 'Completed',
      progress: 100,
      dueDate: isoOffsetDays(-1),
      estimatedMinutes: 60,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk-5',
      studentId: demoId,
      subjectId: 'sub-os',
      title: 'Deadlock Banker Algorithm Sheet',
      description: 'Needs immediate completion — marked overdue to demonstrate alert.',
      category: 'Assignment',
      priority: 'High',
      status: 'In Progress',
      progress: 40,
      dueDate: isoOffsetDays(-1),
      estimatedMinutes: 75,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const todayIdx = (new Date().getDay() + 6) % 7;
  const studySessions: StudySession[] = [
    {
      id: 'ses-1',
      studentId: demoId,
      subjectId: 'sub-dsa',
      title: 'Balanced Trees Deep Practice',
      dayOfWeek: todayIdx,
      sessionDate: dateOffsetDays(0),
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90,
      recurring: 'Weekly',
      status: 'Completed',
      isFocusLog: false,
      createdAt: now,
    },
    {
      id: 'ses-2',
      studentId: demoId,
      subjectId: 'sub-dbms',
      title: 'Indexing & B+ Trees Revision',
      dayOfWeek: todayIdx,
      sessionDate: dateOffsetDays(0),
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90,
      recurring: 'None',
      status: 'Scheduled',
      isFocusLog: false,
      createdAt: now,
    },
    {
      id: 'ses-3',
      studentId: demoId,
      subjectId: 'sub-os',
      title: 'Virtual Memory & Paging Drill',
      dayOfWeek: (todayIdx + 1) % 7,
      sessionDate: dateOffsetDays(1),
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90,
      recurring: 'Weekly',
      status: 'Scheduled',
      isFocusLog: false,
      createdAt: now,
    },
    {
      id: 'ses-4',
      studentId: demoId,
      subjectId: 'sub-math',
      title: 'Recurrence Relations Mock Quiz',
      dayOfWeek: (todayIdx + 2) % 7,
      sessionDate: dateOffsetDays(2),
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      recurring: 'None',
      status: 'Scheduled',
      isFocusLog: false,
      createdAt: now,
    },
    {
      id: 'ses-5',
      studentId: demoId,
      subjectId: 'sub-dsa',
      title: 'Pomodoro Focus: Dynamic Programming',
      dayOfWeek: (todayIdx + 6) % 7,
      sessionDate: dateOffsetDays(-1),
      startTime: '19:00',
      endTime: '19:50',
      durationMinutes: 50,
      recurring: 'None',
      status: 'Completed',
      isFocusLog: true,
      createdAt: now,
    },
    {
      id: 'ses-6',
      studentId: demoId,
      subjectId: 'sub-dbms',
      title: 'Pomodoro Focus: Query Optimization',
      dayOfWeek: (todayIdx + 5) % 7,
      sessionDate: dateOffsetDays(-2),
      startTime: '18:00',
      endTime: '18:50',
      durationMinutes: 50,
      recurring: 'None',
      status: 'Completed',
      isFocusLog: true,
      createdAt: now,
    },
  ];

  const exams: Exam[] = [
    {
      id: 'exm-1',
      studentId: demoId,
      subjectId: 'sub-dsa',
      title: 'CS301 Mid-Semester Examination',
      examType: 'Mid-Sem',
      examDate: isoOffsetDays(6),
      location: 'Main Academic Block · Hall 204',
      targetScore: 90,
      notes: 'Focus on balanced trees, heaps, and graph traversal complexity.',
      createdAt: now,
    },
    {
      id: 'exm-2',
      studentId: demoId,
      subjectId: 'sub-dbms',
      title: 'CS304 CLA-2 Assessment',
      examType: 'CLA',
      examDate: isoOffsetDays(11),
      location: 'CS Lab 3',
      targetScore: 88,
      notes: 'SQL joins, transaction isolation levels, and 3NF/BCNF proofs.',
      createdAt: now,
    },
    {
      id: 'exm-3',
      studentId: demoId,
      subjectId: 'sub-os',
      title: 'CS302 End-Semester Exam',
      examType: 'End-Sem',
      examDate: isoOffsetDays(26),
      location: 'Auditorium Annex B',
      targetScore: 85,
      notes: 'Full syllabus covering process sync, deadlocks, memory, and file systems.',
      createdAt: now,
    },
  ];

  const syllabus: SyllabusTopic[] = [
    { id: 'syl-1', studentId: demoId, examId: 'exm-1', subjectId: 'sub-dsa', topicTitle: 'AVL & Red-Black Trees', unitName: 'Unit 2', completed: true, estimatedHours: 3, createdAt: now },
    { id: 'syl-2', studentId: demoId, examId: 'exm-1', subjectId: 'sub-dsa', topicTitle: 'Dijkstra & Bellman-Ford Shortest Paths', unitName: 'Unit 3', completed: false, estimatedHours: 2.5, createdAt: now },
    { id: 'syl-3', studentId: demoId, examId: 'exm-1', subjectId: 'sub-dsa', topicTitle: 'Dynamic Programming on DAGs', unitName: 'Unit 4', completed: false, estimatedHours: 3.5, createdAt: now },
    { id: 'syl-4', studentId: demoId, examId: 'exm-2', subjectId: 'sub-dbms', topicTitle: 'Functional Dependencies & BCNF', unitName: 'Unit 2', completed: true, estimatedHours: 2, createdAt: now },
    { id: 'syl-5', studentId: demoId, examId: 'exm-2', subjectId: 'sub-dbms', topicTitle: 'ACID Properties & Two-Phase Locking', unitName: 'Unit 3', completed: false, estimatedHours: 2.5, createdAt: now },
    { id: 'syl-6', studentId: demoId, examId: 'exm-3', subjectId: 'sub-os', topicTitle: 'Semaphores & Classical Sync Problems', unitName: 'Unit 2', completed: true, estimatedHours: 2, createdAt: now },
    { id: 'syl-7', studentId: demoId, examId: 'exm-3', subjectId: 'sub-os', topicTitle: 'Demand Paging & Page Replacement', unitName: 'Unit 4', completed: false, estimatedHours: 3, createdAt: now },
  ];

  const goals: Goal[] = [
    {
      id: 'gol-1',
      studentId: demoId,
      subjectId: 'sub-dsa',
      title: 'Solve 40 Graph & Tree LeetCode Problems',
      targetValue: 40,
      currentValue: 29,
      unit: 'problems',
      deadline: isoOffsetDays(18),
      completed: false,
      createdAt: now,
    },
    {
      id: 'gol-2',
      studentId: demoId,
      subjectId: 'sub-dbms',
      title: 'Complete 25 Hours of Database Lab Practice',
      targetValue: 25,
      currentValue: 18,
      unit: 'hours',
      deadline: isoOffsetDays(14),
      completed: false,
      createdAt: now,
    },
  ];

  const habits: Habit[] = [
    {
      id: 'hab-1',
      studentId: demoId,
      name: 'Morning 50-Minute Deep Focus Block',
      frequency: 'Daily',
      currentStreak: 6,
      bestStreak: 14,
      completedDates: [dateOffsetDays(-5), dateOffsetDays(-4), dateOffsetDays(-3), dateOffsetDays(-2), dateOffsetDays(-1), dateOffsetDays(0)],
      createdAt: now,
    },
    {
      id: 'hab-2',
      studentId: demoId,
      name: 'Evening Flashcard & Formula Review',
      frequency: 'Daily',
      currentStreak: 4,
      bestStreak: 9,
      completedDates: [dateOffsetDays(-3), dateOffsetDays(-2), dateOffsetDays(-1), dateOffsetDays(0)],
      createdAt: now,
    },
  ];

  const notes: Note[] = [
    {
      id: 'not-1',
      studentId: demoId,
      subjectId: 'sub-dsa',
      title: 'Red-Black Tree Invariants Cheat Sheet',
      content: '1. Every node is red or black.\n2. Root is always black.\n3. No two consecutive red nodes.\n4. Every path from a node to its descendant NULL nodes has the same black-height.',
      tags: ['trees', 'mid-sem', 'complexity'],
      attachmentName: null,
      attachmentDataUrl: null,
      attachmentSize: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'not-2',
      studentId: demoId,
      subjectId: 'sub-dbms',
      title: 'SQL Isolation Levels & Anomalies',
      content: 'Read Uncommitted -> Dirty Read possible.\nRead Committed -> Prevents dirty reads.\nRepeatable Read -> Prevents non-repeatable reads (MySQL InnoDB default).\nSerializable -> Full isolation.',
      tags: ['sql', 'transactions', 'cla'],
      attachmentName: null,
      attachmentDataUrl: null,
      attachmentSize: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const marks: MarkRecord[] = [
    { id: 'mrk-1', studentId: demoId, subjectId: 'sub-dsa', examType: 'CLA', assessmentName: 'CLA-1: Asymptotic & Linear DS', obtainedMarks: 27, maxMarks: 30, recordedDate: dateOffsetDays(-28), semesterLabel: 'Sem 5', createdAt: now },
    { id: 'mrk-2', studentId: demoId, subjectId: 'sub-dbms', examType: 'CLA', assessmentName: 'CLA-1: ER Modeling & Relational Algebra', obtainedMarks: 25, maxMarks: 30, recordedDate: dateOffsetDays(-24), semesterLabel: 'Sem 5', createdAt: now },
    { id: 'mrk-3', studentId: demoId, subjectId: 'sub-os', examType: 'Mid-Sem', assessmentName: 'Mid-Sem: Processes & Threads', obtainedMarks: 41, maxMarks: 50, recordedDate: dateOffsetDays(-15), semesterLabel: 'Sem 5', createdAt: now },
    { id: 'mrk-4', studentId: demoId, subjectId: 'sub-math', examType: 'Mid-Sem', assessmentName: 'Mid-Sem: Logic & Combinatorics', obtainedMarks: 46, maxMarks: 50, recordedDate: dateOffsetDays(-12), semesterLabel: 'Sem 5', createdAt: now },
    { id: 'mrk-5', studentId: demoId, subjectId: 'sub-dsa', examType: 'Assignment', assessmentName: 'Lab 2: Graph Traversal Engine', obtainedMarks: 19, maxMarks: 20, recordedDate: dateOffsetDays(-7), semesterLabel: 'Sem 5', createdAt: now },
  ];

  const reminders: Reminder[] = [
    { id: 'rem-1', studentId: demoId, title: 'Submit Red-Black Tree Implementation', remindAt: isoOffsetDays(1), leadMinutes: 60, linkedType: 'Task', active: true, createdAt: now },
    { id: 'rem-2', studentId: demoId, title: 'CS301 Mid-Sem Final Formula Review', remindAt: isoOffsetDays(5), leadMinutes: 120, linkedType: 'Exam', active: true, createdAt: now },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'ntf-1',
      studentId: demoId,
      title: 'Overdue Assignment Alert',
      message: 'Deadlock Banker Algorithm Sheet is past due and currently at 40% completion.',
      type: 'Deadline',
      read: false,
      createdAt: now,
    },
    {
      id: 'ntf-2',
      studentId: demoId,
      title: 'Mid-Sem Exam in 6 Days',
      message: 'CS301 Mid-Semester Examination has 2 syllabus units remaining to review.',
      type: 'Exam',
      read: false,
      createdAt: now,
    },
    {
      id: 'ntf-3',
      studentId: demoId,
      title: '6-Day Study Streak Active',
      message: 'You hit your Morning Deep Focus habit 6 days in a row.',
      type: 'Streak',
      read: true,
      createdAt: now,
    },
  ];

  return {
    students: [
      {
        id: demoId,
        name: 'Aarav Sharma (Demo Student)',
        email: 'demo@mysked.app',
        passwordHash: hashPassword('Demo@1234'),
        university: 'Institute of Technology',
        major: 'B.Tech Computer Science',
        semester: 'Semester 5',
        dailyStudyTargetHours: 4,
        weeklyStudyTargetHours: 25,
        timezone: 'Asia/Kolkata',
        themePreference: 'dark',
        defaultReminderMinutes: 30,
        notificationsEnabled: true,
        isDemo: true,
        createdAt: now,
      },
    ],
    subjects,
    tasks,
    studySessions,
    exams,
    syllabus,
    goals,
    habits,
    notes,
    marks,
    reminders,
    notifications,
  };
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create DATA_DIR:', err);
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as DatabaseSchema;
    } catch {
      // parse failed, fallback below
    }
  }

  // Seed data fallback from original project file
  const originalSeedFile = path.resolve(process.cwd(), 'data', 'mysked-db.json');
  if (fs.existsSync(originalSeedFile)) {
    try {
      const seedContent = fs.readFileSync(originalSeedFile, 'utf8');
      const seedData = JSON.parse(seedContent) as DatabaseSchema;
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf8');
      } catch {}
      return seedData;
    } catch {}
  }

  const initial = createInitialDatabase();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
  } catch {}
  return initial;
}

let db: DatabaseSchema = loadDatabase();

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write database to disk (in-memory state preserved):', err);
  }
}

function sanitizeStudent(row: StudentRow): StudentProfile {
  const { passwordHash: _pw, ...safe } = row;
  return safe;
}

function computeRecommendations(studentId: string): Recommendation[] {
  const recs: Recommendation[] = [];
  const nowMs = Date.now();
  const tasks = db.tasks.filter((t) => t.studentId === studentId && t.status !== 'Completed');
  const subjects = db.subjects.filter((s) => s.studentId === studentId);
  const exams = db.exams.filter((e) => e.studentId === studentId);
  const syllabus = db.syllabus.filter((s) => s.studentId === studentId);
  const habits = db.habits.filter((h) => h.studentId === studentId);

  // Rule 1: Overdue Tasks
  const overdue = tasks.filter((t) => new Date(t.dueDate).getTime() < nowMs);
  if (overdue.length > 0) {
    const top = overdue[0];
    recs.push({
      id: `rec-overdue-${top.id}`,
      title: `Prioritize overdue task: ${top.title}`,
      actionLabel: 'Open Tasks',
      targetPage: 'tasks',
      priority: 'high',
      ruleCode: 'RULE_OVERDUE_DEADLINE',
      explanation: `Rule triggered because "${top.title}" passed its due timestamp (${new Date(top.dueDate).toLocaleDateString()}) and sits at ${top.progress}% completion.`,
    });
  }

  // Rule 2: Upcoming Exam with < 70% Syllabus Completed
  for (const exam of exams) {
    const daysLeft = Math.ceil((new Date(exam.examDate).getTime() - nowMs) / 86400000);
    if (daysLeft >= 0 && daysLeft <= 14) {
      const topics = syllabus.filter((s) => s.examId === exam.id);
      const doneCount = topics.filter((s) => s.completed).length;
      const pct = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0;
      if (pct < 75) {
        recs.push({
          id: `rec-exam-${exam.id}`,
          title: `Schedule revision blocks for ${exam.title}`,
          actionLabel: 'Review Syllabus',
          targetPage: 'exams',
          priority: daysLeft <= 7 ? 'high' : 'medium',
          ruleCode: 'RULE_EXAM_SYLLABUS_GAP',
          explanation: `Rule triggered because ${exam.examType} exam is ${daysLeft} day(s) away with ${pct}% (${doneCount}/${topics.length}) syllabus topics checked off.`,
        });
      }
    }
  }

  // Rule 3: Subject Weekly Target Deficit
  const behindSubjects = subjects
    .filter((s) => s.weeklyTargetHours > 0 && s.loggedHours / s.weeklyTargetHours < 0.65)
    .sort((a, b) => a.loggedHours / a.weeklyTargetHours - b.loggedHours / b.weeklyTargetHours);
  if (behindSubjects.length > 0) {
    const sub = behindSubjects[0];
    const ratio = Math.round((sub.loggedHours / sub.weeklyTargetHours) * 100);
    recs.push({
      id: `rec-sub-${sub.id}`,
      title: `Add a 90-min block for ${sub.name}`,
      actionLabel: 'Plan Session',
      targetPage: 'planner',
      priority: 'medium',
      ruleCode: 'RULE_WEEKLY_TARGET_DEFICIT',
      explanation: `Rule triggered because ${sub.code} (${sub.name}) has ${sub.loggedHours}h logged out of its ${sub.weeklyTargetHours}h weekly target (${ratio}%).`,
    });
  }

  // Rule 4: Urgent/Due-Soon Tasks
  const dueSoon = tasks
    .filter((t) => {
      const hrs = (new Date(t.dueDate).getTime() - nowMs) / 3600000;
      return hrs >= 0 && hrs <= 48;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  if (dueSoon.length > 0) {
    const top = dueSoon[0];
    const hrsLeft = Math.max(1, Math.round((new Date(top.dueDate).getTime() - nowMs) / 3600000));
    recs.push({
      id: `rec-soon-${top.id}`,
      title: `Start a Pomodoro block for ${top.title}`,
      actionLabel: 'Launch Focus Timer',
      targetPage: 'focus',
      priority: 'high',
      ruleCode: 'RULE_48H_DEADLINE_WINDOW',
      explanation: `Rule triggered because "${top.title}" (${top.priority} priority) is due in ~${hrsLeft} hour(s) and needs ${top.estimatedMinutes} min estimated effort.`,
    });
  }

  // Rule 5: Habit Streak Encouragement
  const todayStr = new Date().toISOString().slice(0, 10);
  const uncheckedHabit = habits.find((h) => !h.completedDates.includes(todayStr));
  if (uncheckedHabit) {
    recs.push({
      id: `rec-hab-${uncheckedHabit.id}`,
      title: `Protect your ${uncheckedHabit.currentStreak}-day habit streak`,
      actionLabel: 'Check Habit',
      targetPage: 'goals',
      priority: 'low',
      ruleCode: 'RULE_STREAK_RETENTION',
      explanation: `Rule triggered because "${uncheckedHabit.name}" has not yet been logged for today (${todayStr}).`,
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: 'rec-baseline',
      title: 'Workspace ready — add subjects or tasks to activate study rules',
      actionLabel: 'Add Subject',
      targetPage: 'subjects',
      priority: 'low',
      ruleCode: 'RULE_BASELINE_READY',
      explanation: 'Deterministic rule engine inspects overdue tasks, 48h deadlines, exam syllabus gaps, and weekly subject hour deficits once records exist.',
    });
  }

  return recs.slice(0, 4);
}

function parseVoiceTaskText(transcript: string, studentSubjects: Subject[]) {
  const raw = transcript.trim();
  const lower = raw.toLowerCase();

  let priority: Task['priority'] = 'Medium';
  if (/\b(urgent|asap|critical|immediately)\b/.test(lower)) priority = 'Urgent';
  else if (/\b(high|important|priority)\b/.test(lower)) priority = 'High';
  else if (/\b(low|whenever|minor)\b/.test(lower)) priority = 'Low';

  let category: Task['category'] = 'Assignment';
  if (/\b(homework|hw|sheet|exercise|problem set)\b/.test(lower)) category = 'Homework';
  else if (/\b(project|build|presentation|capstone)\b/.test(lower)) category = 'Project';
  else if (/\b(revise|revision|review|study|exam|quiz)\b/.test(lower)) category = 'Revision';

  let dueOffset = 2;
  if (/\btoday|tonight\b/.test(lower)) dueOffset = 0;
  else if (/\btomorrow\b/.test(lower)) dueOffset = 1;
  else if (/\bnext week\b/.test(lower)) dueOffset = 7;
  else if (/\bfriday\b/.test(lower)) {
    const day = new Date().getDay();
    dueOffset = (5 - day + 7) % 7 || 7;
  } else if (/\bmonday\b/.test(lower)) {
    const day = new Date().getDay();
    dueOffset = (1 - day + 7) % 7 || 7;
  }

  let estimatedMinutes = 60;
  const minMatch = lower.match(/(\d+)\s*(min|minute|minutes)/);
  const hrMatch = lower.match(/(\d+)\s*(hr|hrs|hour|hours)/);
  if (minMatch) estimatedMinutes = Math.min(480, Math.max(15, Number(minMatch[1])));
  else if (hrMatch) estimatedMinutes = Math.min(480, Math.max(30, Number(hrMatch[1]) * 60));

  let matchedSubjectId: string | null = null;
  for (const sub of studentSubjects) {
    const words = sub.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (lower.includes(sub.code.toLowerCase()) || words.some((w) => lower.includes(w))) {
      matchedSubjectId = sub.id;
      break;
    }
  }

  const cleanedTitle = raw
    .replace(/^(remind me to|add task|create task|i need to|schedule)\s+/i, '')
    .replace(/\b(high priority|low priority|medium priority|urgent|asap)\b/gi, '')
    .replace(/\b(due today|due tomorrow|today|tomorrow|next week)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    title: cleanedTitle ? cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1) : raw,
    category,
    priority,
    dueDate: isoOffsetDays(dueOffset),
    subjectId: matchedSubjectId,
    estimatedMinutes,
  };
}

interface AuthedRequest extends Request {
  studentId?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  const cookieToken = req.cookies?.mysked_token as string | undefined;
  const studentId = verifyToken(bearer || cookieToken);
  if (!studentId) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  const student = db.students.find((s) => s.id === studentId);
  if (!student) {
    res.status(401).json({ error: 'Student account not found.' });
    return;
  }
  req.studentId = studentId;
  next();
}

const app = express();

// Path normalization for Vercel / serverless routing
app.use((req, _res, next) => {
  if (
    !req.url.startsWith('/api') &&
    !req.url.startsWith('/assets') &&
    !req.url.startsWith('/@') &&
    !req.url.startsWith('/src')
  ) {
    const originalUrl = req.url;
    if (
      originalUrl.startsWith('/auth') ||
      originalUrl.startsWith('/health') ||
      originalUrl.startsWith('/tasks') ||
      originalUrl.startsWith('/workspace') ||
      originalUrl.startsWith('/subjects') ||
      originalUrl.startsWith('/settings') ||
      originalUrl.startsWith('/exams') ||
      originalUrl.startsWith('/study-planner') ||
      originalUrl.startsWith('/notes') ||
      originalUrl.startsWith('/goals') ||
      originalUrl.startsWith('/habits') ||
      originalUrl.startsWith('/marks') ||
      originalUrl.startsWith('/reminders') ||
      originalUrl.startsWith('/notifications') ||
      originalUrl.startsWith('/focus') ||
      originalUrl.startsWith('/recommendations')
    ) {
      req.url = '/api' + originalUrl;
    }
  }
  next();
});

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mysked-api', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, university, major, semester } = req.body ?? {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (db.students.some((s) => s.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const now = new Date().toISOString();
    const newStudent: StudentRow = {
      id: `stu-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      university: typeof university === 'string' && university.trim() ? university.trim() : 'University',
      major: typeof major === 'string' && major.trim() ? major.trim() : 'Undergraduate Studies',
      semester: typeof semester === 'string' && semester.trim() ? semester.trim() : 'Semester 1',
      dailyStudyTargetHours: 4,
      weeklyStudyTargetHours: 24,
      timezone: 'UTC',
      themePreference: 'dark',
      defaultReminderMinutes: 30,
      notificationsEnabled: true,
      isDemo: false,
      createdAt: now,
    };

    db.students.push(newStudent);
    saveDatabase();

    const token = signToken(newStudent.id);
    res.cookie('mysked_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
    res.status(201).json({ token, student: sanitizeStudent(newStudent) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const student = db.students.find((s) => s.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!student || !verifyPassword(String(password), student.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = signToken(student.id);
    res.cookie('mysked_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ token, student: sanitizeStudent(student) });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email, newPassword } = req.body ?? {};
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }
    const student = db.students.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
    if (!student) {
      res.status(404).json({ error: 'No account found for that email address.' });
      return;
    }
    if (student.isDemo) {
      res.status(400).json({ error: 'The shared demo account password cannot be altered.' });
      return;
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    student.passwordHash = hashPassword(newPassword);
    saveDatabase();
    res.json({ message: 'Password updated successfully. You may now log in.' });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('mysked_token');
    res.json({ message: 'Logged out' });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    const student = db.students.find((s) => s.id === req.studentId)!;
    res.json({ student: sanitizeStudent(student) });
  });

  // Profile & Settings
  app.put('/api/settings/profile', requireAuth, (req: AuthedRequest, res) => {
    const student = db.students.find((s) => s.id === req.studentId)!;
    const {
      name,
      university,
      major,
      semester,
      dailyStudyTargetHours,
      weeklyStudyTargetHours,
      timezone,
      themePreference,
      defaultReminderMinutes,
      notificationsEnabled,
    } = req.body ?? {};

    if (typeof name === 'string' && name.trim().length >= 2) student.name = name.trim();
    if (typeof university === 'string') student.university = university.trim();
    if (typeof major === 'string') student.major = major.trim();
    if (typeof semester === 'string') student.semester = semester.trim();
    if (typeof dailyStudyTargetHours === 'number' && dailyStudyTargetHours >= 1 && dailyStudyTargetHours <= 16) {
      student.dailyStudyTargetHours = dailyStudyTargetHours;
    }
    if (typeof weeklyStudyTargetHours === 'number' && weeklyStudyTargetHours >= 1 && weeklyStudyTargetHours <= 100) {
      student.weeklyStudyTargetHours = weeklyStudyTargetHours;
    }
    if (typeof timezone === 'string' && timezone.trim()) student.timezone = timezone.trim();
    if (themePreference === 'dark' || themePreference === 'light') student.themePreference = themePreference;
    if (typeof defaultReminderMinutes === 'number' && defaultReminderMinutes >= 5) {
      student.defaultReminderMinutes = defaultReminderMinutes;
    }
    if (typeof notificationsEnabled === 'boolean') student.notificationsEnabled = notificationsEnabled;

    saveDatabase();
    res.json({ student: sanitizeStudent(student) });
  });

  app.put('/api/settings/password', requireAuth, (req: AuthedRequest, res) => {
    const student = db.students.find((s) => s.id === req.studentId)!;
    if (student.isDemo) {
      res.status(400).json({ error: 'Password changes are disabled for the shared demo account.' });
      return;
    }
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !verifyPassword(String(currentPassword), student.passwordHash)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    student.passwordHash = hashPassword(String(newPassword));
    saveDatabase();
    res.json({ message: 'Password updated successfully.' });
  });

  // Full student workspace bundle
  app.get('/api/workspace', requireAuth, (req: AuthedRequest, res) => {
    const sid = req.studentId!;
    const student = db.students.find((s) => s.id === sid)!;
    res.json({
      student: sanitizeStudent(student),
      subjects: db.subjects.filter((x) => x.studentId === sid),
      tasks: db.tasks.filter((x) => x.studentId === sid),
      studySessions: db.studySessions.filter((x) => x.studentId === sid),
      exams: db.exams.filter((x) => x.studentId === sid),
      syllabus: db.syllabus.filter((x) => x.studentId === sid),
      goals: db.goals.filter((x) => x.studentId === sid),
      habits: db.habits.filter((x) => x.studentId === sid),
      notes: db.notes.filter((x) => x.studentId === sid),
      marks: db.marks.filter((x) => x.studentId === sid),
      reminders: db.reminders.filter((x) => x.studentId === sid),
      notifications: db.notifications.filter((x) => x.studentId === sid),
      recommendations: computeRecommendations(sid),
    });
  });

  app.get('/api/recommendations', requireAuth, (req: AuthedRequest, res) => {
    res.json({ recommendations: computeRecommendations(req.studentId!) });
  });

  // Subjects CRUD
  app.post('/api/subjects', requireAuth, (req: AuthedRequest, res) => {
    const { name, code, color, weeklyTargetHours, instructor } = req.body ?? {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Subject name is required.' });
      return;
    }
    const subject: Subject = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      name: name.trim(),
      code: typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : 'SUB101',
      color: typeof color === 'string' ? color : '#22d3ee',
      weeklyTargetHours: Math.max(1, Number(weeklyTargetHours) || 5),
      loggedHours: 0,
      instructor: typeof instructor === 'string' ? instructor.trim() : '',
      createdAt: new Date().toISOString(),
    };
    db.subjects.push(subject);
    saveDatabase();
    res.status(201).json(subject);
  });

  app.put('/api/subjects/:id', requireAuth, (req: AuthedRequest, res) => {
    const sub = db.subjects.find((s) => s.id === req.params.id && s.studentId === req.studentId);
    if (!sub) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }
    const { name, code, color, weeklyTargetHours, loggedHours, instructor } = req.body ?? {};
    if (typeof name === 'string' && name.trim()) sub.name = name.trim();
    if (typeof code === 'string' && code.trim()) sub.code = code.trim().toUpperCase();
    if (typeof color === 'string') sub.color = color;
    if (typeof weeklyTargetHours === 'number' && weeklyTargetHours >= 1) sub.weeklyTargetHours = weeklyTargetHours;
    if (typeof loggedHours === 'number' && loggedHours >= 0) sub.loggedHours = loggedHours;
    if (typeof instructor === 'string') sub.instructor = instructor.trim();
    saveDatabase();
    res.json(sub);
  });

  app.delete('/api/subjects/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.subjects.findIndex((s) => s.id === req.params.id && s.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }
    const [removed] = db.subjects.splice(idx, 1);
    db.tasks.forEach((t) => { if (t.subjectId === removed.id) t.subjectId = null; });
    db.studySessions.forEach((s) => { if (s.subjectId === removed.id) s.subjectId = null; });
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  // Tasks CRUD + Voice Parser
  app.post('/api/tasks/voice-parse', requireAuth, (req: AuthedRequest, res) => {
    const { transcript, autoSave } = req.body ?? {};
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      res.status(400).json({ error: 'Voice transcript cannot be empty.' });
      return;
    }
    const studentSubjects = db.subjects.filter((s) => s.studentId === req.studentId);
    const parsed = parseVoiceTaskText(transcript, studentSubjects);
    if (autoSave) {
      const now = new Date().toISOString();
      const created: Task = {
        id: `tsk-${crypto.randomUUID().slice(0, 8)}`,
        studentId: req.studentId!,
        subjectId: parsed.subjectId,
        title: parsed.title,
        description: `Created via Voice Entry: "${transcript.trim()}"`,
        category: parsed.category,
        priority: parsed.priority,
        status: 'Todo',
        progress: 0,
        dueDate: parsed.dueDate,
        estimatedMinutes: parsed.estimatedMinutes,
        createdAt: now,
        updatedAt: now,
      };
      db.tasks.push(created);
      saveDatabase();
      res.status(201).json({ parsed, task: created });
      return;
    }
    res.json({ parsed });
  });

  app.post('/api/tasks', requireAuth, (req: AuthedRequest, res) => {
    const { title, description, subjectId, category, priority, status, progress, dueDate, estimatedMinutes } = req.body ?? {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }
    const now = new Date().toISOString();
    const resolvedStatus = status === 'Completed' || status === 'In Progress' ? status : 'Todo';
    const task: Task = {
      id: `tsk-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      subjectId: subjectId || null,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      category: ['Assignment', 'Homework', 'Project', 'Revision'].includes(category) ? category : 'Assignment',
      priority: ['Low', 'Medium', 'High', 'Urgent'].includes(priority) ? priority : 'Medium',
      status: resolvedStatus,
      progress: resolvedStatus === 'Completed' ? 100 : Math.min(100, Math.max(0, Number(progress) || 0)),
      dueDate: dueDate || isoOffsetDays(2),
      estimatedMinutes: Math.max(10, Number(estimatedMinutes) || 60),
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.push(task);
    saveDatabase();
    res.status(201).json(task);
  });

  app.put('/api/tasks/:id', requireAuth, (req: AuthedRequest, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id && t.studentId === req.studentId);
    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    const { title, description, subjectId, category, priority, status, progress, dueDate, estimatedMinutes } = req.body ?? {};
    if (typeof title === 'string' && title.trim()) task.title = title.trim();
    if (typeof description === 'string') task.description = description.trim();
    if (subjectId !== undefined) task.subjectId = subjectId || null;
    if (['Assignment', 'Homework', 'Project', 'Revision'].includes(category)) task.category = category;
    if (['Low', 'Medium', 'High', 'Urgent'].includes(priority)) task.priority = priority;
    if (['Todo', 'In Progress', 'Completed'].includes(status)) task.status = status;
    if (typeof progress === 'number') {
      task.progress = Math.min(100, Math.max(0, progress));
      if (task.progress === 100) task.status = 'Completed';
    }
    if (task.status === 'Completed') task.progress = 100;
    if (dueDate) task.dueDate = dueDate;
    if (typeof estimatedMinutes === 'number' && estimatedMinutes > 0) task.estimatedMinutes = estimatedMinutes;
    task.updatedAt = new Date().toISOString();
    saveDatabase();
    res.json(task);
  });

  app.delete('/api/tasks/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.tasks.findIndex((t) => t.id === req.params.id && t.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    const [removed] = db.tasks.splice(idx, 1);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  // Study Sessions + Auto-Timetable Generation + Focus Timer Logs
  app.post('/api/sessions', requireAuth, (req: AuthedRequest, res) => {
    const { subjectId, title, dayOfWeek, sessionDate, startTime, endTime, durationMinutes, recurring, status, isFocusLog } = req.body ?? {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Session title is required.' });
      return;
    }
    const dur = Math.max(5, Number(durationMinutes) || 60);
    const session: StudySession = {
      id: `ses-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      subjectId: subjectId || null,
      title: title.trim(),
      dayOfWeek: typeof dayOfWeek === 'number' ? Math.min(6, Math.max(0, dayOfWeek)) : 0,
      sessionDate: sessionDate || dateOffsetDays(0),
      startTime: startTime || '10:00',
      endTime: endTime || '11:00',
      durationMinutes: dur,
      recurring: ['None', 'Daily', 'Weekly'].includes(recurring) ? recurring : 'None',
      status: ['Scheduled', 'Completed', 'Missed'].includes(status) ? status : 'Scheduled',
      isFocusLog: Boolean(isFocusLog),
      createdAt: new Date().toISOString(),
    };

    if (session.status === 'Completed' && session.subjectId) {
      const sub = db.subjects.find((s) => s.id === session.subjectId && s.studentId === req.studentId);
      if (sub) sub.loggedHours = Number((sub.loggedHours + dur / 60).toFixed(2));
    }

    db.studySessions.push(session);
    saveDatabase();
    res.status(201).json(session);
  });

  app.put('/api/sessions/:id', requireAuth, (req: AuthedRequest, res) => {
    const session = db.studySessions.find((s) => s.id === req.params.id && s.studentId === req.studentId);
    if (!session) {
      res.status(404).json({ error: 'Study session not found.' });
      return;
    }
    const prevStatus = session.status;
    const { subjectId, title, dayOfWeek, sessionDate, startTime, endTime, durationMinutes, recurring, status } = req.body ?? {};
    if (typeof title === 'string' && title.trim()) session.title = title.trim();
    if (subjectId !== undefined) session.subjectId = subjectId || null;
    if (typeof dayOfWeek === 'number') session.dayOfWeek = Math.min(6, Math.max(0, dayOfWeek));
    if (typeof sessionDate === 'string') session.sessionDate = sessionDate;
    if (typeof startTime === 'string') session.startTime = startTime;
    if (typeof endTime === 'string') session.endTime = endTime;
    if (typeof durationMinutes === 'number' && durationMinutes >= 5) session.durationMinutes = durationMinutes;
    if (['None', 'Daily', 'Weekly'].includes(recurring)) session.recurring = recurring;
    if (['Scheduled', 'Completed', 'Missed'].includes(status)) session.status = status;

    if (prevStatus !== 'Completed' && session.status === 'Completed' && session.subjectId) {
      const sub = db.subjects.find((s) => s.id === session.subjectId && s.studentId === req.studentId);
      if (sub) sub.loggedHours = Number((sub.loggedHours + session.durationMinutes / 60).toFixed(2));
    }

    saveDatabase();
    res.json(session);
  });

  app.delete('/api/sessions/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.studySessions.findIndex((s) => s.id === req.params.id && s.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Study session not found.' });
      return;
    }
    const [removed] = db.studySessions.splice(idx, 1);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  app.post('/api/sessions/auto-generate', requireAuth, (req: AuthedRequest, res) => {
    const sid = req.studentId!;
    const subjects = db.subjects.filter((s) => s.studentId === sid);
    if (subjects.length === 0) {
      res.status(400).json({ error: 'Add at least one subject before generating an automatic timetable.' });
      return;
    }
    const existing = db.studySessions.filter((s) => s.studentId === sid && !s.isFocusLog);
    const candidateSlots = ['08:30', '11:00', '15:00', '17:30', '20:00'];
    const created: StudySession[] = [];
    const now = new Date().toISOString();

    // Sort subjects by largest remaining weekly deficit
    const ranked = [...subjects].sort(
      (a, b) => (b.weeklyTargetHours - b.loggedHours) - (a.weeklyTargetHours - a.loggedHours),
    );

    let pointer = 0;
    for (let day = 0; day < 7 && created.length < 7; day++) {
      for (const slot of candidateSlots) {
        const collision = existing.some((e) => e.dayOfWeek === day && e.startTime === slot) ||
          created.some((c) => c.dayOfWeek === day && c.startTime === slot);
        if (!collision) {
          const sub = ranked[pointer % ranked.length];
          pointer++;
          const [hh, mm] = slot.split(':').map(Number);
          const endH = String(hh + 1).padStart(2, '0');
          const endM = String(mm).padStart(2, '0');
          const newSes: StudySession = {
            id: `ses-${crypto.randomUUID().slice(0, 8)}`,
            studentId: sid,
            subjectId: sub.id,
            title: `Auto-Scheduled: ${sub.code} Focused Study`,
            dayOfWeek: day,
            sessionDate: dateOffsetDays(day),
            startTime: slot,
            endTime: `${endH}:${endM}`,
            durationMinutes: 60,
            recurring: 'Weekly',
            status: 'Scheduled',
            isFocusLog: false,
            createdAt: now,
          };
          created.push(newSes);
          db.studySessions.push(newSes);
          break; // 1 new generated block per day so it stays balanced
        }
      }
    }

    saveDatabase();
    res.status(201).json({ generatedCount: created.length, sessions: created });
  });

  // Exams & Syllabus
  app.post('/api/exams', requireAuth, (req: AuthedRequest, res) => {
    const { subjectId, title, examType, examDate, location, targetScore, notes } = req.body ?? {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Exam title is required.' });
      return;
    }
    const exam: Exam = {
      id: `exm-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      subjectId: subjectId || null,
      title: title.trim(),
      examType: ['CLA', 'Mid-Sem', 'End-Sem', 'Quiz'].includes(examType) ? examType : 'Mid-Sem',
      examDate: examDate || isoOffsetDays(10),
      location: typeof location === 'string' ? location.trim() : 'Exam Hall',
      targetScore: Math.min(100, Math.max(0, Number(targetScore) || 85)),
      notes: typeof notes === 'string' ? notes.trim() : '',
      createdAt: new Date().toISOString(),
    };
    db.exams.push(exam);
    saveDatabase();
    res.status(201).json(exam);
  });

  app.delete('/api/exams/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.exams.findIndex((e) => e.id === req.params.id && e.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }
    const [removed] = db.exams.splice(idx, 1);
    db.syllabus = db.syllabus.filter((s) => s.examId !== removed.id);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  app.post('/api/syllabus', requireAuth, (req: AuthedRequest, res) => {
    const { examId, subjectId, topicTitle, unitName, estimatedHours } = req.body ?? {};
    if (!examId || !topicTitle || typeof topicTitle !== 'string') {
      res.status(400).json({ error: 'Exam ID and topic title are required.' });
      return;
    }
    const exam = db.exams.find((e) => e.id === examId && e.studentId === req.studentId);
    if (!exam) {
      res.status(404).json({ error: 'Parent exam not found.' });
      return;
    }
    const topic: SyllabusTopic = {
      id: `syl-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      examId,
      subjectId: subjectId || exam.subjectId,
      topicTitle: topicTitle.trim(),
      unitName: typeof unitName === 'string' && unitName.trim() ? unitName.trim() : 'Unit 1',
      completed: false,
      estimatedHours: Math.max(0.5, Number(estimatedHours) || 2),
      createdAt: new Date().toISOString(),
    };
    db.syllabus.push(topic);
    saveDatabase();
    res.status(201).json(topic);
  });

  app.put('/api/syllabus/:id', requireAuth, (req: AuthedRequest, res) => {
    const topic = db.syllabus.find((s) => s.id === req.params.id && s.studentId === req.studentId);
    if (!topic) {
      res.status(404).json({ error: 'Syllabus topic not found.' });
      return;
    }
    if (typeof req.body?.completed === 'boolean') topic.completed = req.body.completed;
    if (typeof req.body?.topicTitle === 'string' && req.body.topicTitle.trim()) {
      topic.topicTitle = req.body.topicTitle.trim();
    }
    saveDatabase();
    res.json(topic);
  });

  app.delete('/api/syllabus/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.syllabus.findIndex((s) => s.id === req.params.id && s.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Topic not found.' });
      return;
    }
    const [removed] = db.syllabus.splice(idx, 1);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  // Goals & Habits
  app.post('/api/goals', requireAuth, (req: AuthedRequest, res) => {
    const { title, subjectId, targetValue, currentValue, unit, deadline } = req.body ?? {};
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Goal title is required.' });
      return;
    }
    const target = Math.max(1, Number(targetValue) || 10);
    const current = Math.max(0, Number(currentValue) || 0);
    const goal: Goal = {
      id: `gol-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      subjectId: subjectId || null,
      title: title.trim(),
      targetValue: target,
      currentValue: current,
      unit: typeof unit === 'string' && unit.trim() ? unit.trim() : 'units',
      deadline: deadline || isoOffsetDays(14),
      completed: current >= target,
      createdAt: new Date().toISOString(),
    };
    db.goals.push(goal);
    saveDatabase();
    res.status(201).json(goal);
  });

  app.put('/api/goals/:id', requireAuth, (req: AuthedRequest, res) => {
    const goal = db.goals.find((g) => g.id === req.params.id && g.studentId === req.studentId);
    if (!goal) {
      res.status(404).json({ error: 'Goal not found.' });
      return;
    }
    if (typeof req.body?.currentValue === 'number') {
      goal.currentValue = Math.max(0, req.body.currentValue);
      goal.completed = goal.currentValue >= goal.targetValue;
    }
    if (typeof req.body?.completed === 'boolean') {
      goal.completed = req.body.completed;
      if (goal.completed && goal.currentValue < goal.targetValue) goal.currentValue = goal.targetValue;
    }
    saveDatabase();
    res.json(goal);
  });

  app.delete('/api/goals/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.goals.findIndex((g) => g.id === req.params.id && g.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Goal not found.' });
      return;
    }
    const [removed] = db.goals.splice(idx, 1);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  app.post('/api/habits', requireAuth, (req: AuthedRequest, res) => {
    const { name, frequency } = req.body ?? {};
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Habit name is required.' });
      return;
    }
    const habit: Habit = {
      id: `hab-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      name: name.trim(),
      frequency: frequency === 'Weekdays' ? 'Weekdays' : 'Daily',
      currentStreak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    db.habits.push(habit);
    saveDatabase();
    res.status(201).json(habit);
  });

  app.post('/api/habits/:id/toggle', requireAuth, (req: AuthedRequest, res) => {
    const habit = db.habits.find((h) => h.id === req.params.id && h.studentId === req.studentId);
    if (!habit) {
      res.status(404).json({ error: 'Habit not found.' });
      return;
    }
    const dateKey = typeof req.body?.date === 'string' ? req.body.date : new Date().toISOString().slice(0, 10);
    const exists = habit.completedDates.includes(dateKey);
    if (exists) {
      habit.completedDates = habit.completedDates.filter((d) => d !== dateKey);
    } else {
      habit.completedDates.push(dateKey);
    }
    // Recalculate consecutive streak ending today or yesterday
    const set = new Set(habit.completedDates);
    let streak = 0;
    const cursor = new Date();
    if (!set.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (set.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    habit.currentStreak = streak;
    if (streak > habit.bestStreak) habit.bestStreak = streak;
    saveDatabase();
    res.json(habit);
  });

  app.delete('/api/habits/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.habits.findIndex((h) => h.id === req.params.id && h.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Habit not found.' });
      return;
    }
    const [removed] = db.habits.splice(idx, 1);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  // Notes & PDF attachments
  app.post('/api/notes', requireAuth, (req: AuthedRequest, res) => {
    const { title, content, subjectId, tags, attachmentName, attachmentDataUrl, attachmentSize } = req.body ?? {};
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Note title is required.' });
      return;
    }
    const now = new Date().toISOString();
    const note: Note = {
      id: `not-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      subjectId: subjectId || null,
      title: title.trim(),
      content: typeof content === 'string' ? content : '',
      tags: Array.isArray(tags) ? tags.map(String) : [],
      attachmentName: attachmentName || null,
      attachmentDataUrl: attachmentDataUrl || null,
      attachmentSize: typeof attachmentSize === 'number' ? attachmentSize : null,
      createdAt: now,
      updatedAt: now,
    };
    db.notes.push(note);
    saveDatabase();
    res.status(201).json(note);
  });

  app.put('/api/notes/:id', requireAuth, (req: AuthedRequest, res) => {
    const note = db.notes.find((n) => n.id === req.params.id && n.studentId === req.studentId);
    if (!note) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }
    const { title, content, subjectId, tags, attachmentName, attachmentDataUrl, attachmentSize } = req.body ?? {};
    if (typeof title === 'string' && title.trim()) note.title = title.trim();
    if (typeof content === 'string') note.content = content;
    if (subjectId !== undefined) note.subjectId = subjectId || null;
    if (Array.isArray(tags)) note.tags = tags.map(String);
    if (attachmentName !== undefined) note.attachmentName = attachmentName;
    if (attachmentDataUrl !== undefined) note.attachmentDataUrl = attachmentDataUrl;
    if (attachmentSize !== undefined) note.attachmentSize = attachmentSize;
    note.updatedAt = new Date().toISOString();
    saveDatabase();
    res.json(note);
  });

  app.delete('/api/notes/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.notes.findIndex((n) => n.id === req.params.id && n.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }
    const [removed] = db.notes.splice(idx, 1);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  // Academic Performance (Marks)
  app.post('/api/marks', requireAuth, (req: AuthedRequest, res) => {
    const { subjectId, examType, assessmentName, obtainedMarks, maxMarks, recordedDate, semesterLabel } = req.body ?? {};
    if (!assessmentName || typeof assessmentName !== 'string') {
      res.status(400).json({ error: 'Assessment name is required.' });
      return;
    }
    const max = Math.max(1, Number(maxMarks) || 100);
    const obtained = Math.min(max, Math.max(0, Number(obtainedMarks) || 0));
    const mark: MarkRecord = {
      id: `mrk-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      subjectId: subjectId || null,
      examType: ['CLA', 'Mid-Sem', 'End-Sem', 'Assignment'].includes(examType) ? examType : 'CLA',
      assessmentName: assessmentName.trim(),
      obtainedMarks: obtained,
      maxMarks: max,
      recordedDate: recordedDate || dateOffsetDays(0),
      semesterLabel: typeof semesterLabel === 'string' && semesterLabel.trim() ? semesterLabel.trim() : 'Current Sem',
      createdAt: new Date().toISOString(),
    };
    db.marks.push(mark);
    saveDatabase();
    res.status(201).json(mark);
  });

  app.delete('/api/marks/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.marks.findIndex((m) => m.id === req.params.id && m.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Mark record not found.' });
      return;
    }
    const [removed] = db.marks.splice(idx, 1);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  // Reminders & Notifications
  app.post('/api/reminders', requireAuth, (req: AuthedRequest, res) => {
    const { title, remindAt, leadMinutes, linkedType } = req.body ?? {};
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Reminder title is required.' });
      return;
    }
    const reminder: Reminder = {
      id: `rem-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      title: title.trim(),
      remindAt: remindAt || isoOffsetDays(1),
      leadMinutes: Math.max(5, Number(leadMinutes) || 30),
      linkedType: ['Task', 'Exam', 'Session', 'Custom'].includes(linkedType) ? linkedType : 'Custom',
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.reminders.push(reminder);
    db.notifications.unshift({
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      studentId: req.studentId!,
      title: 'Reminder Scheduled',
      message: `"${reminder.title}" set for ${new Date(reminder.remindAt).toLocaleString()} (${reminder.leadMinutes}m lead).`,
      type: 'Reminder',
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveDatabase();
    res.status(201).json(reminder);
  });

  app.delete('/api/reminders/:id', requireAuth, (req: AuthedRequest, res) => {
    const idx = db.reminders.findIndex((r) => r.id === req.params.id && r.studentId === req.studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'Reminder not found.' });
      return;
    }
    const [removed] = db.reminders.splice(idx, 1);
    saveDatabase();
    res.json({ deletedId: removed.id });
  });

  app.put('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
    const notif = db.notifications.find((n) => n.id === req.params.id && n.studentId === req.studentId);
    if (!notif) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }
    notif.read = true;
    saveDatabase();
    res.json(notif);
  });

  app.post('/api/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
    db.notifications.forEach((n) => {
      if (n.studentId === req.studentId) n.read = true;
    });
    saveDatabase();
    res.json({ ok: true });
  });

  // Centralized error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

export { app };
export default app;

export async function startServer() {
  const httpServer = http.createServer(app);
  let viteServer: any = null;

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const { createServer: createViteServer } = await import('vite');
    viteServer = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        watch: hmrDisabled ? null : undefined,
      },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else if (!process.env.VERCEL) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  const shutdown = async () => {
    if (viteServer) {
      await viteServer.close().catch(() => {});
    }
    httpServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 2000).unref();
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });

  httpServer.on('error', (err) => {
    console.error(`Failed to bind MySked server on port ${PORT}:`, err);
    process.exit(1);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MySked runtime running on http://0.0.0.0:${PORT}`);
  });
}

// Only auto-start standalone HTTP listener if not running in a serverless environment (e.g. Vercel)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
