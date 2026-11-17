import React, { useState } from 'react';
import { Award, CheckCircle2, Flame, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Goal, Habit, Subject } from '../../types';

interface GoalsHabitsViewProps {
  goals: Goal[];
  habits: Habit[];
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

export const GoalsHabitsView: React.FC<GoalsHabitsViewProps> = ({ goals, habits, subjects, onRefresh }) => {
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(20);
  const [goalUnit, setGoalUnit] = useState('problems');
  const [goalSubjectId, setGoalSubjectId] = useState('');
  const [habitName, setHabitName] = useState('');
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [deleteHabit, setDeleteHabit] = useState<Habit | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().slice(0, 10);
  });

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    await apiRequest('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        title: goalTitle,
        targetValue: goalTarget,
        unit: goalUnit,
        subjectId: goalSubjectId || null,
      }),
    });
    setGoalTitle('');
    await onRefresh();
  };

  const incrementGoal = async (g: Goal, delta: number) => {
    await apiRequest(`/api/goals/${g.id}`, {
      method: 'PUT',
      body: JSON.stringify({ currentValue: Math.min(g.targetValue, g.currentValue + delta) }),
    });
    await onRefresh();
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    await apiRequest('/api/habits', { method: 'POST', body: JSON.stringify({ name: habitName, frequency: 'Daily' }) });
    setHabitName('');
    await onRefresh();
  };

  const toggleHabitDay = async (habitId: string, date: string) => {
    await apiRequest(`/api/habits/${habitId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
    await onRefresh();
  };

  const bestOverallStreak = habits.reduce((m, h) => Math.max(m, h.bestStreak), 0);
  const completedGoalsCount = goals.filter((g) => g.completed).length;

  const badges = [
    { name: 'First Milestone', unlocked: completedGoalsCount >= 1 || goals.some((g) => g.currentValue > 0), desc: 'Logged progress toward a study goal' },
    { name: '3-Day Consistency', unlocked: bestOverallStreak >= 3, desc: 'Reached a 3-day habit streak' },
    { name: '7-Day Focus Master', unlocked: bestOverallStreak >= 7, desc: 'Sustained a 7-day habit streak' },
    { name: 'Goal Finisher', unlocked: completedGoalsCount >= 1, desc: 'Completed a semester goal 100%' },
  ];

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Study Badges</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div
              key={b.name}
              className={`p-3.5 rounded-xl border ${
                b.unlocked
                  ? 'bg-cyan-500/10 border-cyan-500/35 text-slate-900 dark:text-white'
                  : 'bg-slate-100/60 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-55'
              }`}
            >
              <div className="font-display font-bold text-sm">{b.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{b.desc}</div>
              <div className="font-mono text-[11px] mt-2 text-cyan-600 dark:text-cyan-400">
                {b.unlocked ? 'UNLOCKED' : 'LOCKED'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Goals with Progress Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-5">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Academic Goals</h3>

          <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <input
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="New study goal..."
              className="sm:col-span-5 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
            <input
              type="number"
              min={1}
              value={goalTarget}
              onChange={(e) => setGoalTarget(Number(e.target.value))}
              className="sm:col-span-2 px-2.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
            <input
              type="text"
              value={goalUnit}
              onChange={(e) => setGoalUnit(e.target.value)}
              placeholder="unit"
              className="sm:col-span-2 px-2.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
            <select
              value={goalSubjectId}
              onChange={(e) => setGoalSubjectId(e.target.value)}
              className="sm:col-span-3 px-2 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            >
              <option value="">General</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
            </select>
            <button type="submit" className="sm:col-span-12 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </form>

          {goals.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No goals added yet.</p>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                const circ = 2 * Math.PI * 22;
                return (
                  <div key={g.id} className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <svg className="w-14 h-14 -rotate-90 shrink-0" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="5" fill="none" className="text-slate-300 dark:text-white/10" />
                        <circle
                          cx="28"
                          cy="28"
                          r="22"
                          stroke="#22d3ee"
                          strokeWidth="5"
                          fill="none"
                          strokeDasharray={circ}
                          strokeDashoffset={circ * (1 - pct / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{g.title}</div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {g.currentValue} / {g.targetValue} {g.unit} ({pct}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!g.completed && (
                        <button
                          type="button"
                          onClick={() => incrementGoal(g, 1)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 cursor-pointer"
                        >
                          +1
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteGoal(g)}
                        className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                        aria-label="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Habits & 28-Day Consistency Calendar */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-5">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Daily Habits &amp; Consistency Calendar</h3>

          <form onSubmit={handleAddHabit} className="flex gap-2.5">
            <input
              type="text"
              required
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="e.g. 30-Minute Flashcard Review"
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white cursor-pointer">
              Add Habit
            </button>
          </form>

          {habits.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No habits tracked yet.</p>
          ) : (
            <div className="space-y-4">
              {habits.map((h) => {
                const doneToday = h.completedDates.includes(todayStr);
                return (
                  <div key={h.id} className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{h.name}</div>
                        <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <Flame className="w-3.5 h-3.5" /> {h.currentStreak}d streak
                          </span>
                          <span>Best: {h.bestStreak}d</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleHabitDay(h.id, todayStr)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            doneToday ? 'bg-emerald-500 text-slate-950' : 'glass-panel text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{doneToday ? 'Done Today' : 'Check Today'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteHabit(h)}
                          className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                          aria-label="Delete habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 28-day mini heatmap */}
                    <div className="grid grid-cols-14 gap-1.5">
                      {last28Days.map((d) => {
                        const checked = h.completedDates.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            title={d}
                            onClick={() => toggleHabitDay(h.id, d)}
                            className={`h-4 rounded-sm cursor-pointer transition-colors ${
                              checked ? 'bg-cyan-500' : 'bg-slate-300/70 dark:bg-white/10 hover:bg-cyan-500/40'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteGoal}
        title="Delete Goal"
        message={`Delete goal "${deleteGoal?.title}"?`}
        onConfirm={async () => {
          if (deleteGoal) {
            await apiRequest(`/api/goals/${deleteGoal.id}`, { method: 'DELETE' });
            setDeleteGoal(null);
            await onRefresh();
          }
        }}
        onCancel={() => setDeleteGoal(null)}
      />

      <ConfirmDialog
        open={!!deleteHabit}
        title="Delete Habit"
        message={`Delete habit "${deleteHabit?.name}"?`}
        onConfirm={async () => {
          if (deleteHabit) {
            await apiRequest(`/api/habits/${deleteHabit.id}`, { method: 'DELETE' });
            setDeleteHabit(null);
            await onRefresh();
          }
        }}
        onCancel={() => setDeleteHabit(null)}
      />
    </div>
  );
};
