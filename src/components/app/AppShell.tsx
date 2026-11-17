import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  TrendingUp,
  X,
} from 'lucide-react';
import { MySkedLogo } from '../MySkedLogo';
import { DashboardView } from './DashboardView';
import { PlannerView } from './PlannerView';
import { TasksView } from './TasksView';
import { SubjectsView } from './SubjectsView';
import { ExamsView } from './ExamsView';
import { FocusModeView } from './FocusModeView';
import { NotesView } from './NotesView';
import { GoalsHabitsView } from './GoalsHabitsView';
import { AnalyticsView } from './AnalyticsView';
import { PerformanceView } from './PerformanceView';
import { NotificationsView } from './NotificationsView';
import { SettingsView } from './SettingsView';
import type {
  AppNotification,
  AppPage,
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
  ThemeMode,
} from '../../types';

export interface WorkspaceState {
  student: StudentProfile;
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
  recommendations: Recommendation[];
}

interface AppShellProps {
  workspace: WorkspaceState;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onRefresh: () => Promise<void>;
  onLogout: () => Promise<void>;
  onBackToLanding: () => void;
}

const NAV_ITEMS: { id: AppPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'planner', label: 'My Study Planner', icon: Calendar },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
  { id: 'subjects', label: 'My Subjects', icon: BookOpen },
  { id: 'exams', label: 'Exam Preparation', icon: GraduationCap },
  { id: 'focus', label: 'Focus Mode', icon: Clock },
  { id: 'notes', label: 'Notes & Resources', icon: FileText },
  { id: 'goals', label: 'Goals & Habits', icon: Award },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'performance', label: 'Academic Performance', icon: TrendingUp },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC<AppShellProps> = ({
  workspace,
  theme,
  onToggleTheme,
  onRefresh,
  onLogout,
  onBackToLanding,
}) => {
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = workspace.notifications.filter((n) => !n.read).length;
  const activeMeta = NAV_ITEMS.find((item) => item.id === activePage) || NAV_ITEMS[0];

  const handleSelectPage = (page: AppPage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
        <MySkedLogo size="sm" />
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectPage(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/80 dark:border-white/10 space-y-2">
        <div className="px-2 pb-2">
          <div className="font-display font-semibold text-xs text-slate-900 dark:text-white truncate">
            {workspace.student.name}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {workspace.student.major} · {workspace.student.semester}
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToLanding}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/5 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Back to 3D Website</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#050816] dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#070b1e]/90 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 bg-white dark:bg-[#070b1e] h-full border-r border-slate-200 dark:border-white/10">
            {renderSidebarContent()}
          </div>
          <div className="flex-1 bg-slate-950/60" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#050816]/85 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg glass-panel cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                MySked / {activeMeta.label}
              </div>
              <h1 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                {activeMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl glass-panel hover:border-cyan-400/50 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            <button
              type="button"
              onClick={() => setActivePage('notifications')}
              aria-label="Open notifications"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-xs font-mono hover:border-cyan-400/50 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-cyan-500" />
              <span>{unreadCount}</span>
            </button>
          </div>
        </header>

        {workspace.student.isDemo && (
          <div className="px-4 sm:px-6 py-2 bg-cyan-500/10 border-b border-cyan-500/20 text-xs text-cyan-800 dark:text-cyan-300 flex flex-wrap items-center justify-between gap-2">
            <span>
              Demo Account Active (demo@mysked.app) — Sample semester records are preloaded for exploration.
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="font-semibold underline cursor-pointer"
            >
              Switch to Your Own Account
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardView
              student={workspace.student}
              subjects={workspace.subjects}
              tasks={workspace.tasks}
              sessions={workspace.studySessions}
              exams={workspace.exams}
              habits={workspace.habits}
              recommendations={workspace.recommendations}
              theme={theme}
              onNavigate={handleSelectPage}
            />
          )}
          {activePage === 'planner' && (
            <PlannerView
              sessions={workspace.studySessions}
              subjects={workspace.subjects}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'tasks' && (
            <TasksView
              tasks={workspace.tasks}
              subjects={workspace.subjects}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'subjects' && (
            <SubjectsView
              subjects={workspace.subjects}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'exams' && (
            <ExamsView
              exams={workspace.exams}
              syllabus={workspace.syllabus}
              subjects={workspace.subjects}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'focus' && (
            <FocusModeView
              subjects={workspace.subjects}
              sessions={workspace.studySessions}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'notes' && (
            <NotesView
              notes={workspace.notes}
              subjects={workspace.subjects}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'goals' && (
            <GoalsHabitsView
              goals={workspace.goals}
              habits={workspace.habits}
              subjects={workspace.subjects}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'analytics' && (
            <AnalyticsView
              subjects={workspace.subjects}
              tasks={workspace.tasks}
              sessions={workspace.studySessions}
              theme={theme}
            />
          )}
          {activePage === 'performance' && (
            <PerformanceView
              marks={workspace.marks}
              subjects={workspace.subjects}
              theme={theme}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'notifications' && (
            <NotificationsView
              notifications={workspace.notifications}
              reminders={workspace.reminders}
              onRefresh={onRefresh}
            />
          )}
          {activePage === 'settings' && (
            <SettingsView
              student={workspace.student}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onRefresh={onRefresh}
              onExportFullData={() => workspace as unknown as Record<string, unknown>}
            />
          )}
        </main>
      </div>
    </div>
  );
};
