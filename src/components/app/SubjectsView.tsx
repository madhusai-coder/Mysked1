import React, { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Subject } from '../../types';

interface SubjectsViewProps {
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

const COLOR_SWATCHES = ['#22d3ee', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export const SubjectsView: React.FC<SubjectsViewProps> = ({ subjects, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#22d3ee');
  const [weeklyTargetHours, setWeeklyTargetHours] = useState(6);
  const [instructor, setInstructor] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const openNew = () => {
    setEditing(null);
    setName('');
    setCode('');
    setColor('#22d3ee');
    setWeeklyTargetHours(6);
    setInstructor('');
    setShowForm(true);
  };

  const openEdit = (sub: Subject) => {
    setEditing(sub);
    setName(sub.name);
    setCode(sub.code);
    setColor(sub.color);
    setWeeklyTargetHours(sub.weeklyTargetHours);
    setInstructor(sub.instructor);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, code, color, weeklyTargetHours, instructor };
    if (editing) {
      await apiRequest(`/api/subjects/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiRequest('/api/subjects', { method: 'POST', body: JSON.stringify(payload) });
    }
    setShowForm(false);
    await onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiRequest(`/api/subjects/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage your courses, color tags, and weekly hour targets.
        </p>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            {editing ? 'Edit Subject' : 'New Subject'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Subject Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Computer Networks"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Course Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CS310"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Weekly Target (hrs)</label>
              <input
                type="number"
                min={1}
                max={40}
                value={weeklyTargetHours}
                onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Instructor</label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Prof. Name"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Color Accent</label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${color === c ? 'scale-110 ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 cursor-pointer">
              {editing ? 'Update Subject' : 'Create Subject'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {subjects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No subjects registered yet.</p>
          <button type="button" onClick={openNew} className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 cursor-pointer">
            Add Your First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const pct = Math.min(100, Math.round((sub.loggedHours / sub.weeklyTargetHours) * 100));
            return (
              <div key={sub.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold" style={{ color: sub.color }}>
                      {sub.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openEdit(sub)} className="p-1.5 text-slate-400 hover:text-blue-400 cursor-pointer" aria-label="Edit subject">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(sub)} className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer" aria-label="Delete subject">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mt-1">{sub.name}</h3>
                  {sub.instructor && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub.instructor}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300">
                      {sub.loggedHours}h / {sub.weeklyTargetHours}h weekly target
                    </span>
                    <span style={{ color: sub.color }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: sub.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subject"
        message={`Delete ${deleteTarget?.code} (${deleteTarget?.name})? Linked tasks and sessions will become general entries.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
