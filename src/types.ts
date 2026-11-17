export type ThemeMode = 'dark' | 'light';

export type TaskCategory = 'Assignment' | 'Homework' | 'Project' | 'Revision';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Todo' | 'In Progress' | 'Completed';
export type RecurringType = 'None' | 'Daily' | 'Weekly';
export type SessionStatus = 'Scheduled' | 'Completed' | 'Missed';
export type ExamType = 'CLA' | 'Mid-Sem' | 'End-Sem' | 'Quiz';
export type MarkType = 'CLA' | 'Mid-Sem' | 'End-Sem' | 'Assignment';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  university: string;
  major: string;
  semester: string;
  dailyStudyTargetHours: number;
  weeklyStudyTargetHours: number;
  timezone: string;
  themePreference: ThemeMode;
  defaultReminderMinutes: number;
  notificationsEnabled: boolean;
  isDemo: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  studentId: string;
  name: string;
  code: string;
  color: string;
  weeklyTargetHours: number;
  loggedHours: number;
  instructor: string;
  createdAt: string;
}

export interface Task {
  id: string;
  studentId: string;
  subjectId: string | null;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  dueDate: string;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  studentId: string;
  subjectId: string | null;
  title: string;
  dayOfWeek: number; // 0 = Mon ... 6 = Sun
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  recurring: RecurringType;
  status: SessionStatus;
  isFocusLog: boolean;
  createdAt: string;
}

export interface Exam {
  id: string;
  studentId: string;
  subjectId: string | null;
  title: string;
  examType: ExamType;
  examDate: string;
  location: string;
  targetScore: number;
  notes: string;
  createdAt: string;
}

export interface SyllabusTopic {
  id: string;
  studentId: string;
  examId: string;
  subjectId: string | null;
  topicTitle: string;
  unitName: string;
  completed: boolean;
  estimatedHours: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  studentId: string;
  subjectId: string | null;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  studentId: string;
  name: string;
  frequency: 'Daily' | 'Weekdays';
  currentStreak: number;
  bestStreak: number;
  completedDates: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  studentId: string;
  subjectId: string | null;
  title: string;
  content: string;
  tags: string[];
  attachmentName: string | null;
  attachmentDataUrl: string | null;
  attachmentSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarkRecord {
  id: string;
  studentId: string;
  subjectId: string | null;
  examType: MarkType;
  assessmentName: string;
  obtainedMarks: number;
  maxMarks: number;
  recordedDate: string;
  semesterLabel: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  studentId: string;
  title: string;
  remindAt: string;
  leadMinutes: number;
  linkedType: 'Task' | 'Exam' | 'Session' | 'Custom';
  active: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: 'Deadline' | 'Exam' | 'Streak' | 'Reminder' | 'System';
  read: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  actionLabel: string;
  targetPage: AppPage;
  priority: 'high' | 'medium' | 'low';
  ruleCode: string;
  explanation: string;
}

export type AppPage =
  | 'dashboard'
  | 'planner'
  | 'tasks'
  | 'subjects'
  | 'exams'
  | 'focus'
  | 'notes'
  | 'goals'
  | 'analytics'
  | 'performance'
  | 'notifications'
  | 'settings';
