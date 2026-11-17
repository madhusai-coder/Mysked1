import React, { useState } from 'react';
import { CalendarPlus, Check, Edit3, Sparkles, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ConfirmDialog } from '../ConfirmDialog';
import type { RecurringType, SessionStatus, StudySession, Subject } from '../../types';

interface PlannerViewProps {
  sessions: StudySession[];
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const PlannerView: React.FC<PlannerViewProps> = ({ sessions, subjects, onRefresh }) => {
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState<number>((new Date().getDay() + 6) % 7);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [recurring, setRecurring] = useState<RecurringType>('None');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudySession | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const openNew = (day = 0) => {
    setEditingId(null);
    setTitle('');
    setSubjectId(subjects[0]?.id || '');
    setDayOfWeek(day);
    setStartTime('09:00');
    setEndTime('10:30');
    setRecurring('None');
    setShowForm(true);
  };

  const openEdit = (ses: StudySession) => {
    setEditingId(ses.id);
    setTitle(ses.title);
    setSubjectId(ses.subjectId || '');
    setDayOfWeek(ses.dayOfWeek);
    setStartTime(ses.startTime);
    setEndTime(ses.endTime);
    setRecurring(ses.recurring);
    setShowForm(true);
  };

  const computeMinutes = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    return diff > 5 ? diff : 60;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const durationMinutes = computeMinutes(startTime, endTime);
      const payload = {
        title,
        subjectId: subjectId || null,
        dayOfWeek,
        startTime,
        endTime,
        durationMinutes,
        recurring,
      };
      if (editingId) {
        await apiRequest(`/api/sessions/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setFeedback('Study session updated.');
      } else {
        await apiRequest('/api/sessions', { method: 'POST', body: JSON.stringify(payload) });
        setFeedback('Study session added to planner.');
      }
      setShowForm(false);
      await onRefresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to save session.');
    } finally {
      setBusy(false);
    }
  };

  const handleStatusToggle = async (ses: StudySession) => {
    const nextStatus: SessionStatus = ses.status === 'Completed' ? 'Scheduled' : 'Completed';
    await apiRequest(`/api/sessions/${ses.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus }),
    });
    await onRefresh();
  };

  const handleDropOnDay = async (targetDay: number) => {
    if (!draggedId) return;
    const ses = sessions.find((s) => s.id === draggedId);
    setDraggedId(null);
    if (!ses || ses.dayOfWeek === targetDay) return;
    await apiRequest(`/api/sessions/${ses.id}`, {
      method: 'PUT',
      body: JSON.stringify({ dayOfWeek: targetDay }),
    });
    setFeedback(`Moved "${ses.title}" to ${DAYS[targetDay]}.`);
    await onRefresh();
  };

  const handleAutoGenerate = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiRequest<{ generatedCount: number }>('/api/sessions/auto-generate', { method: 'POST' });
      setFeedback(`Generated ${res.generatedCount} balanced weekly study blocks based on subject hour deficits.`);
      await onRefresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Could not generate timetable.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiRequest(`/api/sessions/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await onRefresh();
  };

  const visibleDays = viewMode === 'weekly' ? DAYS.map((name, idx) => ({ name, idx })) : [{ name: DAYS[selectedDay], idx: selectedDay }];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-xl glass-panel">
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${viewMode === 'weekly' ? 'bg-cyan-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Weekly View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${viewMode === 'daily' ? 'bg-cyan-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Daily View
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={handleAutoGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold glass-panel text-purple-600 dark:text-purple-300 hover:border-purple-400/50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto-Generate Timetable</span>
          </button>
          <button
            type="button"
            onClick={() => openNew(selectedDay)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, idx) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${selectedDay === idx ? 'bg-blue-600 text-white' : 'glass-panel text-slate-600 dark:text-slate-300'}`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <div className="px-4 py-2.5 rounded-xl text-xs font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
          {feedback}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            {editingId ? 'Edit Study Session' : 'New Study Session'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Session Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Graph Algorithms Drill"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                <option value="">General Study</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Recurring</label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as RecurringType)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                <option value="None">One-Time</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
            >
              {editingId ? 'Save Changes' : 'Create Session'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Tip: Drag and drop any session card onto another day column to reschedule it instantly.
      </p>

      <div className={`grid gap-4 ${viewMode === 'weekly' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-7' : 'grid-cols-1'}`}>
        {visibleDays.map(({ name, idx }) => {
          const daySessions = sessions
            .filter((s) => s.dayOfWeek === idx && !s.isFocusLog)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={name}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOnDay(idx)}
              className="glass-panel rounded-2xl p-4 min-h-[240px] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-white/10">
                <span className="font-display font-bold text-sm text-slate-900 dark:text-white">{name}</span>
                <button
                  type="button"
                  onClick={() => openNew(idx)}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  + Add
                </button>
              </div>

              {daySessions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 text-center">
                  Drop session here
                </div>
              ) : (
                <div className="space-y-2.5">
                  {daySessions.map((ses) => {
                    const sub = subjects.find((s) => s.id === ses.subjectId);
                    return (
                      <div
                        key={ses.id}
                        draggable
                        onDragStart={() => setDraggedId(ses.id)}
                        className="p-3 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 cursor-grab active:cursor-grabbing space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span>{ses.startTime}–{ses.endTime}</span>
                          {sub && <span style={{ color: sub.color }}>{sub.code}</span>}
                        </div>
                        <div className={`text-xs font-semibold ${ses.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {ses.title}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-500">{ses.recurring !== 'None' ? ses.recurring : `${ses.durationMinutes}m`}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(ses)}
                              title="Toggle completed"
                              className={`p-1 rounded-md cursor-pointer ${ses.status === 'Completed' ? 'text-emerald-500' : 'text-slate-400 hover:text-cyan-400'}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(ses)}
                              title="Edit session"
                              className="p-1 rounded-md text-slate-400 hover:text-blue-400 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(ses)}
                              title="Delete session"
                              className="p-1 rounded-md text-slate-400 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Study Session"
        message={`Remove "${deleteTarget?.title}" from your study planner?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
