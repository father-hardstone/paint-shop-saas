import React from 'react';
import { Compass, LayoutDashboard, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  isAuthenticated: boolean;
  onNavigateHome: () => void;
  onNavigateDashboard: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  isAuthenticated,
  onNavigateHome,
  onNavigateDashboard,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          404 - Page Not Found
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Lost in the Workshop?
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
          The link or page you are looking for doesn't exist, has been moved, or is under maintenance. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated ? (
            <button
              onClick={onNavigateDashboard}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Shop Dashboard
            </button>
          ) : (
            <button
              onClick={onNavigateHome}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Paintly Home
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
            className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
