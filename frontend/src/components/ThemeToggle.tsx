import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAuth();
  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label="Toggle Day / Night mode"
      title={`Switch to ${isDark ? 'Day' : 'Night'} Mode`}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/90 border border-slate-700/80 dark:border-slate-700 light:border-slate-300 shadow-2xl flex items-center justify-center text-slate-200 dark:text-slate-200 light:text-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600" />
      )}
    </button>
  );
};
