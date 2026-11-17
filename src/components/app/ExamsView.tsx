import React, { useState } from 'react';
import { CalendarPlus, CheckSquare, Plus, Square, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Exam, ExamType, Subject, SyllabusTopic } from '../../types';

interface ExamsViewProps {
  exams: Exam[];
  syllabus: SyllabusTopic[];
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ exams, syllabus, subjects, onRefresh }) => {
  const [showAddExam, setShowAddExam] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examType, setExamType] = useState<ExamType>('Mid-Sem');
  const [examDate, setExamDate] = useState(new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10));
  const [location, setLocation] = useState('Main Hall');
  const [targetScore, setTargetScore] = useState(85);
  const [newTopicText, setNewTopicText] = useState<Record<string, string>>({});
  const [newUnitText, setNewUnitText] = useState<Record<string, string>>({});
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/api/exams', {
      method: 'POST',
      body: JSON.stringify({
        title,
        subjectId: subjectId || null,
        examType,
        examDate: new Date(examDate).toISOString(),
        location,
        targetScore,
      }),
    });
    setTitle('');
    setShowAddExam(false);
    await onRefresh();
  };

  const handleAddTopic = async (exam: Exam) => {
    const topicTitle = newTopicText[exam.id]?.trim();
    if (!topicTitle) return;
    await apiRequest('/api/syllabus', {
      method: 'POST',
      body: JSON.stringify({
        examId: exam.id,
        subjectId: exam.subjectId,
        topicTitle,
        unitName: newUnitText[exam.id]?.trim() || 'Unit 1',
      }),
    });
    setNewTopicText((p) => ({ ...p, [exam.id]: '' }));
    await onRefresh();
  };

  const toggleTopic = async (topic: SyllabusTopic) => {
    await apiRequest(`/api/syllabus/${topic.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: !topic.completed }),
    });
    await onRefresh();
  };

  const scheduleRevisionSession = async (exam: Exam) => {
    const todayIdx = (new Date().getDay() + 6) % 7;
    await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        subjectId: exam.subjectId,
        title: `Revision: ${exam.title}`,
        dayOfWeek: (todayIdx + 1) % 7,
        startTime: '16:00',
        endTime: '17:30',
        durationMinutes: 90,
        recurring: 'None',
      }),
    });
    setPlanNotice(`Scheduled a 90-minute revision block for "${exam.title}" in your Study Planner.`);
    await onRefresh();
  };

  const confirmDeleteExam = async () => {
    if (!deleteExam) return;
    await apiRequest(`/api/exams/${deleteExam.id}`, { method: 'DELETE' });
    setDeleteExam(null);
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Track CLA, Mid-Sem, and End-Sem countdowns with weighted syllabus checklists.
        </p>
        <button
          type="button"
          onClick={() => setShowAddExam((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 text-white cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </div>

      {planNotice && (
        <div className="px-4 py-2.5 rounded-xl text-xs font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
          {planNotice}
        </div>
      )}

      {showAddExam && (
        <form onSubmit={handleCreateExam} className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Exam Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CS301 End-Sem Exam"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                <option value="CLA">CLA</option>
                <option value="Mid-Sem">Mid-Sem</option>
                <option value="End-Sem">End-Sem</option>
                <option value="Quiz">Quiz</option>
              </select>
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
              <label className="block text-xs font-medium mb-1">Exam Date</label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Target Score (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 cursor-pointer">
              Save Exam
            </button>
            <button type="button" onClick={() => setShowAddExam(false)} className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {exams.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No exams scheduled yet.</p>
          <button type="button" onClick={() => setShowAddExam(true)} className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 cursor-pointer">
            Add First Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const topics = syllabus.filter((t) => t.examId === exam.id);
            const doneCount = topics.filter((t) => t.completed).length;
            const pct = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0;
            const daysLeft = Math.ceil((new Date(exam.examDate).getTime() - Date.now()) / 86400000);
            const sub = subjects.find((s) => s.id === exam.subjectId);

            return (
              <div key={exam.id} className="glass-panel rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-purple-600 dark:text-purple-400">
                      {exam.examType} {sub ? `· ${sub.code}` : ''} · {exam.location}
                    </div>
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mt-0.5">{exam.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(exam.examDate).toLocaleDateString()} · Target {exam.targetScore}%
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xl font-bold text-cyan-600 dark:text-cyan-400">
                      {daysLeft >= 0 ? `${daysLeft}d` : 'Past'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteExam(exam)}
                      className="text-slate-400 hover:text-red-500 mt-1 cursor-pointer"
                      aria-label={`Delete ${exam.title}`}
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </div>
                </div>

                {/* Syllabus Completion Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span>Syllabus Completion ({doneCount}/{topics.length} units)</span>
                    <span className="text-cyan-600 dark:text-cyan-400">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-white/5 text-left hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {topic.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${topic.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {topic.unitName}: {topic.topicTitle}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">{topic.estimatedHours}h</span>
                    </button>
                  ))}
                </div>

                {/* Add Topic Inline */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <input
                    type="text"
                    value={newUnitText[exam.id] || ''}
                    onChange={(e) => setNewUnitText((p) => ({ ...p, [exam.id]: e.target.value }))}
                    placeholder="Unit"
                    className="w-20 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                  />
                  <input
                    type="text"
                    value={newTopicText[exam.id] || ''}
                    onChange={(e) => setNewTopicText((p) => ({ ...p, [exam.id]: e.target.value }))}
                    placeholder="Add syllabus topic..."
                    className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTopic(exam)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 cursor-pointer"
                  >
                    Add Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => scheduleRevisionSession(exam)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Plan Revision</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteExam}
        title="Delete Exam"
        message={`Delete "${deleteExam?.title}" and its syllabus checklist?`}
        onConfirm={confirmDeleteExam}
        onCancel={() => setDeleteExam(null)}
      />
    </div>
  );
};
