import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { chartGridColor, chartTextColor } from '../../lib/charts';
import { ConfirmDialog } from '../ConfirmDialog';
import type { MarkRecord, MarkType, Subject, ThemeMode } from '../../types';

interface PerformanceViewProps {
  marks: MarkRecord[];
  subjects: Subject[];
  theme: ThemeMode;
  onRefresh: () => Promise<void>;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ marks, subjects, theme, onRefresh }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [examType, setExamType] = useState<MarkType>('CLA');
  const [assessmentName, setAssessmentName] = useState('');
  const [obtainedMarks, setObtainedMarks] = useState(25);
  const [maxMarks, setMaxMarks] = useState(30);
  const [semesterLabel, setSemesterLabel] = useState('Sem 5');
  const [deleteTarget, setDeleteTarget] = useState<MarkRecord | null>(null);

  const overallAverage =
    marks.length > 0
      ? marks.reduce((sum, m) => sum + (m.obtainedMarks / m.maxMarks) * 100, 0) / marks.length
      : 0;

  // Subject averages comparison
  const subjectStats = subjects.map((sub) => {
    const subMarks = marks.filter((m) => m.subjectId === sub.id);
    const avg =
      subMarks.length > 0
        ? subMarks.reduce((s, m) => s + (m.obtainedMarks / m.maxMarks) * 100, 0) / subMarks.length
        : 0;
    return { sub, count: subMarks.length, avg: Number(avg.toFixed(1)) };
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/api/marks', {
      method: 'POST',
      body: JSON.stringify({
        subjectId: subjectId || null,
        examType,
        assessmentName,
        obtainedMarks,
        maxMarks,
        semesterLabel,
      }),
    });
    setAssessmentName('');
    setShowAdd(false);
    await onRefresh();
  };

  const chartData = {
    labels: subjectStats.length > 0 ? subjectStats.map((s) => s.sub.code) : ['No Subjects'],
    datasets: [
      {
        label: 'Subject Average (%)',
        data: subjectStats.length > 0 ? subjectStats.map((s) => s.avg) : [0],
        backgroundColor: subjectStats.length > 0 ? subjectStats.map((s) => s.sub.color) : ['#64748b'],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Overall Average</div>
            <div className="font-mono text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {marks.length > 0 ? `${overallAverage.toFixed(1)}%` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Assessments Recorded</div>
            <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{marks.length}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 text-white cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Marks</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <label className="block text-xs font-medium mb-1">Assessment Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as MarkType)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                <option value="CLA">CLA</option>
                <option value="Mid-Sem">Mid-Sem</option>
                <option value="End-Sem">End-Sem</option>
                <option value="Assignment">Assignment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Assessment Name</label>
              <input
                type="text"
                required
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                placeholder="e.g. CLA-2 Trees & Heaps"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Obtained Marks</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={obtainedMarks}
                onChange={(e) => setObtainedMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Maximum Marks</label>
              <input
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Semester</label>
              <input
                type="text"
                value={semesterLabel}
                onChange={(e) => setSemesterLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 cursor-pointer">
              Save Mark Record
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-4">Subject Percentage Comparison</h3>
        <div className="h-60">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme) } },
                y: { beginAtZero: true, max: 100, grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme) } },
              },
            }}
          />
        </div>
      </div>

      {marks.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No marks recorded yet. Add your CLA, Mid-Sem, or End-Sem scores to view averages.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-white/10 text-xs font-mono text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Assessment</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Score</th>
                  <th className="px-5 py-3 text-right">Percentage</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-white/5">
                {marks.map((m) => {
                  const sub = subjects.find((s) => s.id === m.subjectId);
                  const pct = ((m.obtainedMarks / m.maxMarks) * 100).toFixed(1);
                  return (
                    <tr key={m.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{m.assessmentName}</td>
                      <td className="px-5 py-3 font-mono text-xs">{sub ? sub.code : 'General'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{m.examType}</td>
                      <td className="px-5 py-3 text-right font-mono">{m.obtainedMarks} / {m.maxMarks}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">{pct}%</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(m)}
                          className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                          aria-label={`Delete ${m.assessmentName}`}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Mark Record"
        message={`Remove "${deleteTarget?.assessmentName}"?`}
        onConfirm={async () => {
          if (deleteTarget) {
            await apiRequest(`/api/marks/${deleteTarget.id}`, { method: 'DELETE' });
            setDeleteTarget(null);
            await onRefresh();
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
