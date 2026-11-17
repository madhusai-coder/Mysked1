import React, { useState } from 'react';
import { Download, Save } from 'lucide-react';
import { apiRequest, downloadTextFile } from '../../lib/api';
import type { StudentProfile, ThemeMode } from '../../types';

interface SettingsViewProps {
  student: StudentProfile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onRefresh: () => Promise<void>;
  onExportFullData: () => Record<string, unknown>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  student,
  theme,
  onToggleTheme,
  onRefresh,
  onExportFullData,
}) => {
  const [name, setName] = useState(student.name);
  const [university, setUniversity] = useState(student.university);
  const [major, setMajor] = useState(student.major);
  const [semester, setSemester] = useState(student.semester);
  const [dailyTarget, setDailyTarget] = useState(student.dailyStudyTargetHours);
  const [weeklyTarget, setWeeklyTarget] = useState(student.weeklyStudyTargetHours);
  const [timezone, setTimezone] = useState(student.timezone);
  const [defaultReminder, setDefaultReminder] = useState(student.defaultReminderMinutes);
  const [notificationsEnabled, setNotificationsEnabled] = useState(student.notificationsEnabled);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    await apiRequest('/api/settings/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        university,
        major,
        semester,
        dailyStudyTargetHours: dailyTarget,
        weeklyStudyTargetHours: weeklyTarget,
        timezone,
        themePreference: theme,
        defaultReminderMinutes: defaultReminder,
        notificationsEnabled,
      }),
    });
    setProfileMsg('Profile and study targets saved.');
    await onRefresh();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwError(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile & Targets */}
      <form onSubmit={handleSaveProfile} className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Student Profile, Targets &amp; Preferences
          </h3>
          <button
            type="button"
            onClick={onToggleTheme}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold glass-panel cursor-pointer"
          >
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">University</label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Major / Track</label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Semester</label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Daily Study Target (hrs)</label>
            <input
              type="number"
              min={1}
              max={16}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Weekly Study Target (hrs)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Default Reminder Lead Time</label>
            <select
              value={defaultReminder}
              onChange={(e) => setDefaultReminder(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 accent-cyan-500"
          />
          <span>Enable deadline &amp; exam reminder notifications</span>
        </label>

        {profileMsg && <p className="text-xs font-mono text-emerald-500">{profileMsg}</p>}

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </form>

      {/* Security / Password Change */}
      <form onSubmit={handlePasswordChange} className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Security &amp; Password</h3>
        {student.isDemo ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Password modification is locked on the shared Demo Student account. Register your own account to change passwords.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                />
              </div>
            </div>
            {pwMsg && <p className="text-xs font-mono text-emerald-500">{pwMsg}</p>}
            {pwError && <p className="text-xs font-mono text-red-500">{pwError}</p>}
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold glass-panel hover:border-cyan-400/50 cursor-pointer">
              Update Password
            </button>
          </>
        )}
      </form>

      {/* Data Export */}
      <div className="glass-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Full Academic Data Export</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download a complete snapshot of your subjects, tasks, timetable sessions, exams, notes, and marks.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              `mysked-full-export-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify(onExportFullData(), null, 2),
              'application/json',
            )
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download JSON Snapshot</span>
        </button>
      </div>
    </div>
  );
};
