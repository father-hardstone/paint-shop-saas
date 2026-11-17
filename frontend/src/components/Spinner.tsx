import React from 'react';
import { Loader2 } from 'lucide-react';

/** Small inline spinner for buttons and toolbars. Inherits the surrounding text colour. */
export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <Loader2 className={`animate-spin ${className}`} role="status" aria-label="Loading" />
);

/** Centered spinner with a label, for lists and pages that are waiting on data. */
export const LoadingBlock: React.FC<{ label?: string; className?: string }> = ({ label = 'Loading…', className = 'py-12' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 text-slate-400 light:text-slate-600 ${className}`} role="status" aria-live="polite">
    <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);
