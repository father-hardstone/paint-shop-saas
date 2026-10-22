import React from 'react';
import { 
  Palette, 
  LayoutDashboard, 
  ArrowLeft, 
  LogIn, 
  UserPlus, 
  HelpCircle, 
  Sparkles,
  SearchX
} from 'lucide-react';

interface NotFoundPageProps {
  isAuthenticated: boolean;
  onNavigateHome: () => void;
  onNavigateDashboard: () => void;
  onNavigateSignIn?: () => void;
  onNavigateSignUp?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  isAuthenticated,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateSignIn,
  onNavigateSignUp,
}) => {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors relative overflow-hidden">
      {/* Decorative radial lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-indigo-600/15 via-indigo-900/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Minimal Top Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between relative z-10">
        <div 
          onClick={isAuthenticated ? onNavigateDashboard : onNavigateHome} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent">
              Paintly
            </span>
            <span className="text-[10px] block text-slate-400 font-medium">Smart Paint & Utility SaaS</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              if (isAuthenticated) onNavigateDashboard();
              else onNavigateHome();
            }
          }}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </header>

      {/* Main 404 Experience */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-12 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
          
          {/* Subtle top rainbow border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-600" />

          {/* Badge & Big 404 Accent */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
            <SearchX className="w-3.5 h-3.5 text-indigo-400" />
            <span>404 Error • Page Not Found</span>
          </div>

          <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white/95 mb-4 select-none">
            <span className="bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent">
              404
            </span>
          </h1>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3">
            This shade of page does not exist.
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4 max-w-md mx-auto">
            We couldn't mix the page you were looking for. The formula or URL path might have moved, or you entered an unassigned route.
          </p>

          {currentPath && (
            <div className="inline-block bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1 mb-8 text-xs font-mono text-rose-300/80 max-w-full truncate">
              {currentPath}
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            {isAuthenticated ? (
              <button
                onClick={onNavigateDashboard}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Shop Dashboard</span>
              </button>
            ) : (
              <button
                onClick={onNavigateHome}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Go to Paintly Home</span>
              </button>
            )}

            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/';
                }
              }}
              className="py-3 px-6 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 transition-all border border-slate-700/70 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Quick Helpful Navigation Links */}
          <div className="pt-6 border-t border-slate-800/80">
            <p className="text-xs text-slate-400 font-medium mb-3 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Looking for one of these pages?</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={onNavigateHome}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Landing Page
              </button>
              {onNavigateSignIn && (
                <button
                  onClick={onNavigateSignIn}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3 h-3 text-indigo-400" />
                  Sign In
                </button>
              )}
              {onNavigateSignUp && (
                <button
                  onClick={onNavigateSignUp}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3 text-emerald-400" />
                  Sign Up
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={onNavigateDashboard}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LayoutDashboard className="w-3 h-3 text-purple-400" />
                  Dashboard
                </button>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-400">
        Paintly SaaS • Precision Tinting & Inventory Platform
      </footer>
    </div>
  );
};
