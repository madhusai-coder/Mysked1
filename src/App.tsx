import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { AppShell, type WorkspaceState } from './components/app/AppShell';
import { apiRequest, setStoredToken } from './lib/api';
import type { StudentProfile, ThemeMode } from './types';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('mysked_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('mysked_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const loadWorkspace = useCallback(async () => {
    setLoadingWorkspace(true);
    setErrorMsg(null);
    try {
      const data = await apiRequest<WorkspaceState>('/api/workspace');
      setWorkspace(data);
    } catch (err) {
      setWorkspace(null);
      setErrorMsg(err instanceof Error ? err.message : null);
    } finally {
      setLoadingWorkspace(false);
    }
  }, []);

  // Restore active session silently if token/cookie exists
  useEffect(() => {
    apiRequest<WorkspaceState>('/api/workspace')
      .then((data) => setWorkspace(data))
      .catch(() => setWorkspace(null));
  }, []);

  const handleToggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const handleAuthSuccess = async (_student: StudentProfile) => {
    setAuthModalMode(null);
    await loadWorkspace();
    setView('app');
  };

  const handleDemoLogin = async () => {
    setLoadingWorkspace(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ token: string; student: StudentProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'demo@mysked.app', password: 'Demo@1234' }),
      });
      setStoredToken(res.token);
      await loadWorkspace();
      setView('app');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to start demo session.');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleLogout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setStoredToken(null);
    setWorkspace(null);
    setView('landing');
  };

  return (
    <>
      {errorMsg && view === 'app' && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl bg-red-600 text-white text-xs font-medium shadow-lg">
          {errorMsg}
        </div>
      )}

      {loadingWorkspace && view === 'app' && !workspace ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#050816]">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
            <span>Loading MySked Workspace...</span>
          </div>
        </div>
      ) : view === 'app' && workspace ? (
        <AppShell
          workspace={workspace}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onRefresh={loadWorkspace}
          onLogout={handleLogout}
          onBackToLanding={() => setView('landing')}
        />
      ) : (
        <LandingPage
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenAuth={(mode) => setAuthModalMode(mode)}
          onDemoLogin={handleDemoLogin}
          isAuthenticated={!!workspace}
          onEnterApp={() => setView('app')}
        />
      )}

      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
