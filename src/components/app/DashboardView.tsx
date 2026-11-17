import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ArrowRight, BookOpen, Calendar, CheckCircle2, Clock, Flame, GraduationCap, Lightbulb } from 'lucide-react';
import { TiltGlassCard } from '../three/TiltGlassCard';
import { chartGridColor, chartTextColor } from '../../lib/charts';
import type {
  AppPage,
  Exam,
  Habit,
  Recommendation,
  StudentProfile,
  StudySession,
  Subject,
  Task,
  ThemeMode,
} from '../../types';

interface DashboardViewProps {
  student: StudentProfile;
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  exams: Exam[];
  habits: Habit[];
  recommendations: Recommendation[];
  theme: ThemeMode;
  onNavigate: (page: AppPage) => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  student,
  subjects,
  tasks,
  sessions,
  exams,
  habits,
  recommendations,
  theme,
  onNavigate,
}) => {
  const totalLoggedHours = subjects.reduce((sum, s) => sum + s.loggedHours, 0);
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.length - completedTasks;
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.currentStreak), 0);

  // Deterministic productivity score computed strictly from real records
  const taskRatio = tasks.length > 0 ? completedTasks / tasks.length : 0;
  const hourRatio = student.weeklyStudyTargetHours > 0 ? Math.min(1, totalLoggedHours / student.weeklyStudyTargetHours) : 0;
  const completedSessions = sessions.filter((s) => s.status === 'Completed').length;
  const sessionRatio = sessions.length > 0 ? completedSessions / sessions.length : 0;
  const hasAnyData = tasks.length > 0 || sessions.length > 0 || subjects.length > 0;
  const productivityScore = hasAnyData
    ? Math.round((taskRatio * 0.4 + hourRatio * 0.35 + sessionRatio * 0.25) * 100)
    : 0;

  const todayIdx = (new Date().getDay() + 6) % 7;
  const todaysSessions = sessions
    .filter((s) => s.dayOfWeek === todayIdx && !s.isFocusLog)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingExams = [...exams]
    .filter((e) => new Date(e.examDate).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .slice(0, 3);

  const upcomingDeadlines = [...tasks]
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  // Weekly hours per day from real Study_Sessions
  const hoursByDay = DAY_NAMES.map((_, dayIdx) => {
    const mins = sessions
      .filter((s) => s.dayOfWeek === dayIdx)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    return Number((mins / 60).toFixed(2));
  });

  const weeklyChartData = {
    labels: DAY_NAMES,
    datasets: [
      {
        label: 'Scheduled & Focus Hours',
        data: hoursByDay,
        backgroundColor: 'rgba(34, 211, 238, 0.75)',
        borderColor: '#22d3ee',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <TiltGlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Study Hours Logged</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalLoggedHours.toFixed(1)}h <span className="text-xs font-normal text-slate-500">/ {student.weeklyStudyTargetHours}h</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
              style={{ width: `${Math.min(100, Math.round(hourRatio * 100))}%` }}
            />
          </div>
        </TiltGlassCard>

        <TiltGlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tasks Completed / Pending</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {completedTasks} <span className="text-xs font-normal text-slate-500">done · {pendingTasks} pending</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {tasks.length === 0 ? 'Add your first task to begin' : `${Math.round(taskRatio * 100)}% completion rate`}
          </div>
        </TiltGlassCard>

        <TiltGlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Productivity Score</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {productivityScore}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Weighted from tasks, hours & sessions
          </div>
        </TiltGlassCard>

        <TiltGlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {maxStreak} {maxStreak === 1 ? 'Day' : 'Days'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {habits.length} tracked habit{habits.length === 1 ? '' : 's'}
          </div>
        </TiltGlassCard>
      </div>

      {/* Rule-Based Recommendation Engine */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-cyan-500" />
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Rule-Based Study Advisor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic recommendations computed from your deadlines, syllabus progress, and hour deficits
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-cyan-700 dark:text-cyan-400">{rec.ruleCode}</span>
                  <span className={rec.priority === 'high' ? 'text-red-500' : rec.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">{rec.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{rec.explanation}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(rec.targetPage)}
                className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                <span>{rec.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Row: Weekly Chart + Today's Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Weekly Study Distribution
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              Full Analytics
            </button>
          </div>
          <div className="h-60">
            <Bar
              data={weeklyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme) } },
                  y: { beginAtZero: true, grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme) } },
                },
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Today&apos;s Timetable ({DAY_NAMES[todayIdx]})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('planner')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              Open Planner
            </button>
          </div>

          {todaysSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Calendar className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No study sessions scheduled for today.</p>
              <button
                type="button"
                onClick={() => onNavigate('planner')}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 cursor-pointer"
              >
                Schedule Today
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaysSessions.map((ses) => {
                const sub = subjects.find((s) => s.id === ses.subjectId);
                return (
                  <div key={ses.id} className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {ses.startTime} – {ses.endTime} {sub ? `· ${sub.code}` : ''}
                      </div>
                      <div className="font-medium text-sm text-slate-900 dark:text-white truncate">{ses.title}</div>
                    </div>
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 shrink-0">{ses.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Upcoming Exams & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Upcoming Exams</h3>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              Exam Prep
            </button>
          </div>
          {upcomingExams.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No upcoming exams added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((ex) => {
                const daysLeft = Math.max(0, Math.ceil((new Date(ex.examDate).getTime() - Date.now()) / 86400000));
                return (
                  <div key={ex.id} className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <GraduationCap className="w-5 h-5 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{ex.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {ex.examType} · {new Date(ex.examDate).toLocaleDateString()} · {ex.location}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0">
                      {daysLeft}d left
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Pending Deadlines</h3>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              All Tasks
            </button>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No pending deadlines. You are caught up.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((t) => {
                const overdue = new Date(t.dueDate).getTime() < Date.now();
                return (
                  <div key={t.id} className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{t.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t.category} · {t.priority} · Due {new Date(t.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`font-mono text-xs font-semibold shrink-0 ${overdue ? 'text-red-500' : 'text-cyan-600 dark:text-cyan-400'}`}>
                      {overdue ? 'OVERDUE' : `${t.progress}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
