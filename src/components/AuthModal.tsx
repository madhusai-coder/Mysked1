import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { MySkedLogo } from './MySkedLogo';
import { apiRequest, setStoredToken } from '../lib/api';
import type { StudentProfile } from '../types';

interface AuthModalProps {
  initialMode: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess: (student: StudentProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('Semester 1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiRequest<{ token: string; student: StudentProfile }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setStoredToken(res.token);
        onSuccess(res.student);
      } else if (mode === 'register') {
        const res = await apiRequest<{ token: string; student: StudentProfile }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, university, major, semester }),
        });
        setStoredToken(res.token);
        onSuccess(res.student);
      } else {
        const res = await apiRequest<{ message: string }>('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email, newPassword: password }),
        });
        setInfoMsg(res.message);
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; student: StudentProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'demo@mysked.app', password: 'Demo@1234' }),
      });
      setStoredToken(res.token);
      onSuccess(res.student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign into demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl w-full max-w-md p-6 sm:p-7 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <MySkedLogo />
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-4">
            {mode === 'login' ? 'Sign in to MySked' : mode === 'register' ? 'Create Student Account' : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'register'
              ? 'New accounts start completely clean with isolated student records.'
              : mode === 'forgot'
                ? 'Enter your registered email and choose a new password.'
                : 'Access your timetable, tasks, exams, and analytics.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {infoMsg && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Patel"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {mode === 'forgot' ? 'New Password (min 6 chars)' : 'Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Major / Track</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="Semester 4"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">University (Optional)</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="State Technical University"
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}</span>
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleDemo}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors cursor-pointer"
          >
            Try Clearly Labeled Demo Student (demo@mysked.app)
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            {mode !== 'register' ? (
              <button type="button" onClick={() => setMode('register')} className="hover:text-cyan-500 cursor-pointer">
                Need an account? Register
              </button>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="hover:text-cyan-500 cursor-pointer">
                Already registered? Sign In
              </button>
            )}
            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgot')} className="hover:text-cyan-500 cursor-pointer">
                Forgot password?
              </button>
            )}
            {mode === 'forgot' && (
              <button type="button" onClick={() => setMode('login')} className="hover:text-cyan-500 cursor-pointer">
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
