import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Palette, 
  BarChart3, 
  Wrench, 
  Check, 
  Zap
} from 'lucide-react';

interface LandingPageProps {
  onNavigateSignIn: () => void;
  onNavigateSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateSignIn,
  onNavigateSignUp,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900 flex flex-col font-sans transition-colors overflow-x-hidden">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0">
              <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent block leading-tight">
                Paintly
              </span>
              <span className="text-[10px] sm:text-xs block text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium truncate max-w-[170px] sm:max-w-none">
                SaaS for Modern Paint & Utility Shops
              </span>
            </div>
          </div>

          {/* Top Bar Actions: ONLY Sign In button shows up */}
          <div className="flex items-center gap-2">
            <button
              id="landing-signin-btn"
              onClick={onNavigateSignIn}
              className="px-4 sm:px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-14 sm:pb-20 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/60 via-slate-950 to-slate-950 dark:from-indigo-950/60 dark:via-slate-950 dark:to-slate-950 light:from-indigo-100/60 light:via-slate-50 light:to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 text-xs font-semibold mb-5 sm:mb-6 max-w-full">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Designed for Paint & Hardware Retailers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900 mb-4 sm:mb-6 leading-tight">
            Sell paint, coatings, and utilities{' '}
            <span className="bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent block sm:inline mt-1 sm:mt-0">
              faster and without waste.
            </span>
          </h1>

          <p className="text-slate-300 dark:text-slate-300 light:text-slate-600 text-sm sm:text-lg md:text-xl max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            Paintly helps paint store owners calculate real-time pigment mixes, price custom color formulas accurately, track inventory across litres and utility supplies, and fulfill customer orders seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={onNavigateSignUp}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Open Your Shop Dashboard</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onNavigateSignIn}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              Sign In with Phone or Email
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-800/70 dark:border-slate-800/70 light:border-slate-200 shadow-sm">
              <div className="text-xl sm:text-2xl font-bold text-amber-400">0%</div>
              <div className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">Mixing calculation error margin</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-800/70 dark:border-slate-800/70 light:border-slate-200 shadow-sm">
              <div className="text-xl sm:text-2xl font-bold text-indigo-400">Instant</div>
              <div className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">Litre-based price & stock quotes</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-800/70 dark:border-slate-800/70 light:border-slate-200 shadow-sm">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400">100%</div>
              <div className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">Order traceability & customer logs</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-white border border-slate-800/70 dark:border-slate-800/70 light:border-slate-200 shadow-sm">
              <div className="text-xl sm:text-2xl font-bold text-purple-400">PKR</div>
              <div className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">Pakistani mobile & currency ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="py-14 sm:py-20 bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-100 border-y border-slate-800/60 dark:border-slate-800/60 light:border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
              Why Paint & Utility Retailers Need Paintly
            </h2>
            <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 mt-2 sm:mt-3 text-sm sm:text-base">
              Eliminate guesswork when mixing tints, selling brushes, thinners, primers, and custom batches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:border-indigo-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 sm:mb-5">
                <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white dark:text-white light:text-slate-900 mb-2">Precision Tint Formulation</h3>
              <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs sm:text-sm leading-relaxed">
                Adjust base pigment proportions dynamically. The system verifies in-stock litres in real-time and prevents costly over-commitments.
              </p>
            </div>

            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:border-indigo-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 sm:mb-5">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white dark:text-white light:text-slate-900 mb-2">Paint & Utilities Unified</h3>
              <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs sm:text-sm leading-relaxed">
                Sell paints alongside essential utility accessories — thinners, rollers, sandpaper, masking tape, and sealants — under unified order records.
              </p>
            </div>

            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:border-indigo-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 sm:mb-5">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white dark:text-white light:text-slate-900 mb-2">Automated Inventory Deduction</h3>
              <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs sm:text-sm leading-relaxed">
                Every confirmed order automatically deducts exact volume shares from your stock, keeping your inventory numbers accurate at all times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Helps You Sell Better */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-4 border border-amber-500/20">
                <Zap className="w-3.5 h-3.5" /> Direct Shop Impact
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight mb-4 sm:mb-6 leading-snug">
                Turn walk-in inquiries into paid, blended orders in minutes.
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 mt-1 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-slate-100 dark:text-slate-100 light:text-slate-800">Speed up customer counter checkout</h4>
                    <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs sm:text-sm">Customers immediately see what the blend looks like and get instant price quotations per litre.</p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 mt-1 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-slate-100 dark:text-slate-100 light:text-slate-800">Reduce returned or rejected paint cans</h4>
                    <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs sm:text-sm">Formulations are saved in the system, so repeating a previous customer blend is exact and instant.</p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 mt-1 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-slate-100 dark:text-slate-100 light:text-slate-800">Built for Pakistani paint stores</h4>
                    <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs sm:text-sm">Sign in with standard local mobile numbers (e.g., 0300 1111111) or your business email.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl relative overflow-hidden">
              <div className="text-xs uppercase font-bold tracking-wider text-indigo-400 mb-2">Live Store Flow</div>
              <h3 className="text-lg sm:text-xl font-bold text-white dark:text-white light:text-slate-900 mb-5 sm:mb-6">Automated Order Cycle</h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 dark:text-slate-200 light:text-slate-700">Customer requests custom tint + supplies</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-indigo-400 font-semibold shrink-0">Counter</span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-600/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 dark:text-slate-200 light:text-slate-700">Formulator checks pigment stock & costs</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-amber-400 font-semibold shrink-0">Automated</span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 dark:text-slate-200 light:text-slate-700">Order logged & inventory stock deducted</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-emerald-400 font-semibold shrink-0">Real-time</span>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-center">
                <button
                  onClick={onNavigateSignUp}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Create Shop Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 bg-slate-950 dark:bg-slate-950 light:bg-white py-6 sm:py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
          <div>© {new Date().getFullYear()} Paintly. All rights reserved.</div>
          <div className="flex gap-4 sm:gap-6 flex-wrap justify-center items-center">
            <button onClick={onNavigateSignIn} className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors cursor-pointer">Sign In</button>
            <button onClick={onNavigateSignUp} className="hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 transition-colors cursor-pointer">Sign Up</button>
            <span className="text-slate-600">|</span>
            <span>Cloud SaaS Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
