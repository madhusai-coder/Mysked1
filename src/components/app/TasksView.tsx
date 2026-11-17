import React, { useMemo, useState } from 'react';
import { Mic, MicOff, Plus, Search, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Subject, Task, TaskCategory, TaskPriority, TaskStatus } from '../../types';

interface TasksViewProps {
  tasks: Task[];
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ tasks, subjects, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Assignment');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);

  // Voice entry state
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    const prioWeight: Record<TaskPriority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    return tasks
      .filter((t) => {
        if (statusFilter !== 'All' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return prioWeight[b.priority] - prioWeight[a.priority];
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, search, statusFilter, priorityFilter, sortBy]);

  const overdueCount = tasks.filter((t) => t.status !== 'Completed' && new Date(t.dueDate).getTime() < Date.now()).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        subjectId: subjectId || null,
        category,
        priority,
        dueDate: new Date(dueDate).toISOString(),
        estimatedMinutes,
      }),
    });
    setTitle('');
    setDescription('');
    setShowAdd(false);
    await onRefresh();
  };

  const handleProgressChange = async (task: Task, progress: number) => {
    const status: TaskStatus = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Todo';
    await apiRequest(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ progress, status }),
    });
    await onRefresh();
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    await apiRequest(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, progress: status === 'Completed' ? 100 : task.progress }),
    });
    await onRefresh();
  };

  const startVoiceCapture = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      setVoiceMessage('Browser speech recognition is unavailable here. Type your spoken command below as a manual fallback.');
      return;
    }
    const recognition = new Rec();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setListening(true);
    setVoiceMessage('Listening... speak your task (e.g. "Finish DBMS homework high priority due tomorrow").');
    recognition.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript || '';
      setVoiceTranscript(spoken);
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
      setVoiceMessage('Could not capture microphone audio. Use manual fallback input below.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handleVoiceParseAndSave = async () => {
    if (!voiceTranscript.trim()) return;
    const res = await apiRequest<{ task: Task }>('/api/tasks/voice-parse', {
      method: 'POST',
      body: JSON.stringify({ transcript: voiceTranscript, autoSave: true }),
    });
    setVoiceTranscript('');
    setVoiceMessage(`Saved parsed task: "${res.task.title}" (${res.task.priority} · ${res.task.category})`);
    await onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiRequest(`/api/tasks/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Overdue Alert Banner */}
      {overdueCount > 0 && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
          Overdue Alert: {overdueCount} active task{overdueCount > 1 ? 's have' : ' has'} passed their scheduled due date.
        </div>
      )}

      {/* Voice Task Entry Box */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
              Voice Task Entry (with Manual Fallback)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speak or type natural phrasing like &ldquo;Finish Operating Systems lab urgent due tomorrow 90 minutes&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={startVoiceCapture}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              listening ? 'bg-red-500 text-white' : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{listening ? 'Listening...' : 'Speak Task'}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={voiceTranscript}
            onChange={(e) => setVoiceTranscript(e.target.value)}
            placeholder="Voice transcript or manual command fallback..."
            className="flex-1 px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
          />
          <button
            type="button"
            onClick={handleVoiceParseAndSave}
            disabled={!voiceTranscript.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            Parse & Save Task
          </button>
        </div>
        {voiceMessage && <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{voiceMessage}</p>}
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | TaskStatus)}
            className="px-3 py-2 rounded-xl text-xs font-medium glass-panel"
          >
            <option value="All">All Statuses</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'All' | TaskPriority)}
            className="px-3 py-2 rounded-xl text-xs font-medium glass-panel"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority')}
            className="px-3 py-2 rounded-xl text-xs font-medium glass-panel"
          >
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Compiler Lab 3"
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
                <option value="">General</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                <option value="Assignment">Assignment</option>
                <option value="Homework">Homework</option>
                <option value="Project">Project</option>
                <option value="Revision">Revision</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Notes / Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deliverables or rubric details..."
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Est. Minutes</label>
              <input
                type="number"
                min={10}
                max={480}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 cursor-pointer">
              Save Task
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No tasks match your filters yet.</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 cursor-pointer"
          >
            Create First Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const sub = subjects.find((s) => s.id === task.subjectId);
            const overdue = task.status !== 'Completed' && new Date(task.dueDate).getTime() < Date.now();
            return (
              <div key={task.id} className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                    {sub && <span style={{ color: sub.color }}>{sub.code}</span>}
                    <span>{task.category}</span>
                    <span>·</span>
                    <span className={task.priority === 'Urgent' ? 'text-red-500 font-bold' : task.priority === 'High' ? 'text-amber-500' : ''}>
                      {task.priority}
                    </span>
                    <span>·</span>
                    <span className={overdue ? 'text-red-500 font-semibold' : ''}>
                      Due {new Date(task.dueDate).toLocaleDateString()} {overdue ? '(Overdue)' : ''}
                    </span>
                  </div>
                  <h4 className={`font-display font-bold text-base ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{task.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={task.progress}
                      onChange={(e) => handleProgressChange(task, Number(e.target.value))}
                      aria-label={`Progress for ${task.title}`}
                      className="w-24 accent-cyan-500 cursor-pointer"
                    />
                    <span className="font-mono text-xs w-10 text-right">{task.progress}%</span>
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(task)}
                    aria-label={`Delete ${task.title}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Task"
        message={`Permanently delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
