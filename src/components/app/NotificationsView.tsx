import React, { useState } from 'react';
import { Bell, CheckCheck, Clock, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { AppNotification, Reminder } from '../../types';

interface NotificationsViewProps {
  notifications: AppNotification[];
  reminders: Reminder[];
  onRefresh: () => Promise<void>;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, reminders, onRefresh }) => {
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [leadMinutes, setLeadMinutes] = useState(30);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await apiRequest('/api/reminders', {
      method: 'POST',
      body: JSON.stringify({
        title,
        remindAt: new Date(remindAt).toISOString(),
        leadMinutes,
        linkedType: 'Custom',
      }),
    });
    setTitle('');
    await onRefresh();
  };

  const markRead = async (id: string) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' });
    await onRefresh();
  };

  const markAllRead = async () => {
    await apiRequest('/api/notifications/read-all', { method: 'POST' });
    await onRefresh();
  };

  const deleteReminder = async (id: string) => {
    await apiRequest(`/api/reminders/${id}`, { method: 'DELETE' });
    await onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* In-App Notifications */}
      <div className="lg:col-span-7 glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-500" />
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">In-App Notifications</h3>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No notifications yet.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border ${
                  n.read
                    ? 'bg-slate-100/50 dark:bg-white/5 border-slate-200/70 dark:border-white/5 opacity-75'
                    : 'bg-cyan-500/8 border-cyan-500/30'
                } flex items-start justify-between gap-4`}
              >
                <div>
                  <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{n.type}</div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">{n.title}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 shrink-0 cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configurable Reminders */}
      <div className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" />
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Scheduled Reminders</h3>
        </div>

        <form onSubmit={handleAddReminder} className="space-y-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reminder title..."
            className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="datetime-local"
              required
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
            <select
              value={leadMinutes}
              onChange={(e) => setLeadMinutes(Number(e.target.value))}
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            >
              <option value={15}>15 min before</option>
              <option value={30}>30 min before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 text-white cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Reminder</span>
          </button>
        </form>

        <div className="space-y-2.5">
          {reminders.map((r) => (
            <div key={r.id} className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">{r.title}</div>
                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {new Date(r.remindAt).toLocaleString()} · {r.leadMinutes}m lead
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteReminder(r.id)}
                className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                aria-label="Delete reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
