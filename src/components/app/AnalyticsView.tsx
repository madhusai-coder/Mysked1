import React, { useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import { downloadTextFile } from '../../lib/api';
import { chartGridColor, chartTextColor } from '../../lib/charts';
import type { StudySession, Subject, Task, ThemeMode } from '../../types';

interface AnalyticsViewProps {
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  theme: ThemeMode;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ subjects, tasks, sessions, theme }) => {
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const dayHours = DAYS.map((_, idx) =>
    Number((sessions.filter((s) => s.dayOfWeek === idx).reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(2)),
  );

  // Build trend labels based on selected range from real session dates
  const trendLabels =
    range === 'daily'
      ? ['08:00', '11:00', '14:00', '17:00', '20:00']
      : range === 'weekly'
        ? DAYS
        : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const trendValues =
    range === 'daily'
      ? ['08', '11', '14', '17', '20'].map((slot) =>
          Number(
            (
              sessions
                .filter((s) => s.startTime.startsWith(slot.slice(0, 1)) || s.startTime.startsWith(slot))
                .reduce((acc, s) => acc + s.durationMinutes, 0) / 60
            ).toFixed(2),
          ),
        )
      : range === 'weekly'
        ? dayHours
        : [0, 1, 2, 3].map((wk) =>
            Number(
              (
                sessions
                  .filter((_, idx) => idx % 4 === wk)
                  .reduce((acc, s) => acc + s.durationMinutes, 0) / 60
              ).toFixed(2),
            ),
          );

  const barData = {
    labels: subjects.length > 0 ? subjects.map((s) => s.code) : ['No Subjects'],
    datasets: [
      {
        label: 'Logged Hours',
        data: subjects.length > 0 ? subjects.map((s) => s.loggedHours) : [0],
        backgroundColor: subjects.length > 0 ? subjects.map((s) => s.color) : ['#64748b'],
        borderRadius: 6,
      },
      {
        label: 'Weekly Target',
        data: subjects.length > 0 ? subjects.map((s) => s.weeklyTargetHours) : [0],
        backgroundColor: 'rgba(148, 163, 184, 0.25)',
        borderRadius: 6,
      },
    ],
  };

  const lineData = {
    labels: trendLabels,
    datasets: [
      {
        label: `Study Output (${range})`,
        data: trendValues,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.16)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const taskStatusCounts = [
    tasks.filter((t) => t.status === 'Completed').length,
    tasks.filter((t) => t.status === 'In Progress').length,
    tasks.filter((t) => t.status === 'Todo').length,
  ];
  const hasTasks = tasks.length > 0;

  const pieData = {
    labels: hasTasks ? ['Completed', 'In Progress', 'Todo'] : ['No Tasks'],
    datasets: [
      {
        data: hasTasks ? taskStatusCounts : [1],
        backgroundColor: hasTasks ? ['#10b981', '#3b82f6', '#a855f7'] : ['rgba(148,163,184,0.2)'],
        borderWidth: 0,
      },
    ],
  };

  const exportCsv = () => {
    const rows = [
      ['Subject Code', 'Subject Name', 'Logged Hours', 'Weekly Target Hours'].join(','),
      ...subjects.map((s) => [s.code, `"${s.name}"`, s.loggedHours, s.weeklyTargetHours].join(',')),
    ];
    downloadTextFile(`mysked-study-report-${new Date().toISOString().slice(0, 10)}.csv`, rows.join('\n'), 'text/csv');
  };

  const exportJson = () => {
    downloadTextFile(
      `mysked-analytics-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ exportedAt: new Date().toISOString(), subjects, tasks, sessions }, null, 2),
      'application/json',
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl glass-panel">
          {(['daily', 'weekly', 'monthly'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                range === r ? 'bg-cyan-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold glass-panel hover:border-cyan-400/50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold glass-panel hover:border-purple-400/50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-4">
            Subject Hours vs. Weekly Target (Bar)
          </h3>
          <div className="h-64">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: chartTextColor(theme) } } },
                scales: {
                  x: { grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme) } },
                  y: { beginAtZero: true, grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme) } },
                },
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel rounded-2xl p-6">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-4">
            Task Completion Breakdown (Pie)
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: chartTextColor(theme) } } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-4">
          Study Output Trajectory ({range})
        </h3>
        <div className="h-64">
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: chartTextColor(theme) } } },
              scales: {
                x: { grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme) } },
                y: { beginAtZero: true, grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme) } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};
