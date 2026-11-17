import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { StudySession, Subject } from '../../types';

interface FocusModeViewProps {
  subjects: Subject[];
  sessions: StudySession[];
  onRefresh: () => Promise<void>;
}

function playProceduralChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const start = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.46);
    });
  } catch {
    // ignore audio block
  }
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({ subjects, sessions, onRefresh }) => {
  const [workMins, setWorkMins] = useState(25);
  const [shortBreakMins, setShortBreakMins] = useState(5);
  const [longBreakMins, setLongBreakMins] = useState(15);
  const [cyclesBeforeLong, setCyclesBeforeLong] = useState(4);

  const [phase, setPhase] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [sessionTitle, setSessionTitle] = useState('Deep Focus Sprint');
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const phaseTotalSeconds =
    phase === 'focus' ? workMins * 60 : phase === 'shortBreak' ? shortBreakMins * 60 : longBreakMins * 60;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, workMins, shortBreakMins, longBreakMins, completedCycles]);

  const handlePhaseComplete = async () => {
    setRunning(false);
    if (soundEnabled) playProceduralChime();

    if (phase === 'focus') {
      const nextCount = completedCycles + 1;
      setCompletedCycles(nextCount);
      const todayIdx = (new Date().getDay() + 6) % 7;
      const now = new Date();
      const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await apiRequest('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: selectedSubjectId || null,
          title: sessionTitle || 'Pomodoro Focus Block',
          dayOfWeek: todayIdx,
          startTime,
          endTime: startTime,
          durationMinutes: workMins,
          status: 'Completed',
          isFocusLog: true,
        }),
      });
      await onRefresh();

      if (nextCount % cyclesBeforeLong === 0) {
        setPhase('longBreak');
        setSecondsLeft(longBreakMins * 60);
        setStatusNote(`Logged ${workMins}m focus block! Starting ${longBreakMins}m long break.`);
      } else {
        setPhase('shortBreak');
        setSecondsLeft(shortBreakMins * 60);
        setStatusNote(`Logged ${workMins}m focus block! Ready for a ${shortBreakMins}m short break.`);
      }
    } else {
      setPhase('focus');
      setSecondsLeft(workMins * 60);
      setStatusNote('Break complete. Ready for the next focus sprint.');
    }
  };

  const switchPhase = (next: 'focus' | 'shortBreak' | 'longBreak') => {
    setRunning(false);
    setPhase(next);
    setSecondsLeft((next === 'focus' ? workMins : next === 'shortBreak' ? shortBreakMins : longBreakMins) * 60);
  };

  const handleLogEarly = async () => {
    const elapsedMins = Math.max(5, Math.round((phaseTotalSeconds - secondsLeft) / 60));
    const todayIdx = (new Date().getDay() + 6) % 7;
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        subjectId: selectedSubjectId || null,
        title: sessionTitle || 'Focus Session',
        dayOfWeek: todayIdx,
        startTime,
        endTime: startTime,
        durationMinutes: elapsedMins,
        status: 'Completed',
        isFocusLog: true,
      }),
    });
    setRunning(false);
    setSecondsLeft(workMins * 60);
    setStatusNote(`Saved ${elapsedMins} minutes to your Focus History.`);
    await onRefresh();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const progress = Math.min(1, Math.max(0, 1 - secondsLeft / Math.max(1, phaseTotalSeconds)));
  const circumference = 2 * Math.PI * 108;

  const focusHistory = sessions.filter((s) => s.isFocusLog).slice(-10).reverse();

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Timer Ring */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {([
              { id: 'focus', label: 'Focus Sprint' },
              { id: 'shortBreak', label: 'Short Break' },
              { id: 'longBreak', label: 'Long Break' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchPhase(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  phase === tab.id ? 'bg-cyan-500 text-slate-950' : 'glass-panel text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-64 h-64 -rotate-90" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r="108" stroke="currentColor" strokeWidth="10" fill="none" className="text-slate-200 dark:text-white/10" />
              <circle
                cx="120"
                cy="120"
                r="108"
                stroke="url(#pomodoro-ring)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
              />
              <defs>
                <linearGradient id="pomodoro-ring" x1="0" y1="0" x2="240" y2="240">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                {mins}:{secs}
              </div>
              <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-2">
                Cycle {(completedCycles % cyclesBeforeLong) + 1} of {cyclesBeforeLong}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white cursor-pointer"
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{running ? 'Pause' : 'Start Focus'}</span>
            </button>
            <button
              type="button"
              onClick={() => switchPhase(phase)}
              className="p-2.5 rounded-xl glass-panel text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="p-2.5 rounded-xl glass-panel text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="Toggle timer sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-500" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl glass-panel text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="Toggle distraction-free fullscreen"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {phase === 'focus' && secondsLeft < phaseTotalSeconds && (
            <button
              type="button"
              onClick={handleLogEarly}
              className="mt-4 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              Finish &amp; Log Elapsed Focus Time Now
            </button>
          )}

          {statusNote && (
            <div className="mt-4 px-4 py-2 rounded-xl text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
              {statusNote}
            </div>
          )}
        </div>

        {/* Configurable Pomodoro Settings & History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Timer Configuration</h3>
            <div>
              <label className="block text-xs font-medium mb-1">Session Label</label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Credit Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                <option value="">General Study</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Focus (min)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={workMins}
                  onChange={(e) => {
                    const val = Math.max(5, Number(e.target.value));
                    setWorkMins(val);
                    if (phase === 'focus' && !running) setSecondsLeft(val * 60);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Short Break (min)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={shortBreakMins}
                  onChange={(e) => setShortBreakMins(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Long Break (min)</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={longBreakMins}
                  onChange={(e) => setLongBreakMins(Math.max(5, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Cycles / Long Break</label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={cyclesBeforeLong}
                  onChange={(e) => setCyclesBeforeLong(Math.max(2, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">Focus History</h3>
            {focusHistory.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete a focus block to record your first session.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {focusHistory.map((h) => {
                  const sub = subjects.find((s) => s.id === h.subjectId);
                  return (
                    <div key={h.id} className="px-3 py-2.5 rounded-xl bg-slate-100/80 dark:bg-white/5 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">{h.title}</div>
                        <div className="text-slate-500 dark:text-slate-400">{h.sessionDate} {sub ? `· ${sub.code}` : ''}</div>
                      </div>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 shrink-0">{h.durationMinutes}m</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
