import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ThemeToggle } from './components/ThemeToggle';
import { ErrorBoundary } from './components/ErrorBoundary';

type ViewMode = 'landing' | 'signin' | 'signup' | 'dashboard' | 'settings' | '404';

function getInitialView(): ViewMode {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (path === '/' || path === '') return 'landing';
  if (path === '/signin' || path === '/login') return 'signin';
  if (path === '/signup' || path === '/register') return 'signup';
  if (path === '/dashboard') return 'dashboard';
  if (path === '/settings') return 'settings';
  return '404';
}

function AppContent() {
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>(getInitialView);

  // Sync browser path navigation
  const navigateTo = (view: ViewMode) => {
    setCurrentView(view);
    const pathMap: Record<ViewMode, string> = {
      landing: '/',
      signin: '/signin',
      signup: '/signup',
      dashboard: '/dashboard',
      settings: '/settings',
      '404': '/404'
    };
    const path = pathMap[view] || '/';
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict redirection rule:
  // An authenticated account/signed-in account will ALWAYS be redirected to the dashboard whenever it lands on a public url.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (currentView === 'landing' || currentView === 'signin' || currentView === 'signup') {
        navigateTo('dashboard');
      }
    }
  }, [isAuthenticated, isLoading, currentView]);

  // Loading state while checking token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Paintly...</p>
        </div>
      </div>
    );
  }

  // Render view
  let pageContent;

  if (currentView === '404') {
    pageContent = (
      <NotFoundPage
        isAuthenticated={isAuthenticated}
        onNavigateHome={() => navigateTo('landing')}
        onNavigateDashboard={() => navigateTo('dashboard')}
      />
    );
  } else if (isAuthenticated) {
    if (currentView === 'settings') {
      pageContent = (
        <SettingsPage
          onSignOut={() => {
            signOut();
            navigateTo('landing');
          }}
          onNavigateDashboard={() => navigateTo('dashboard')}
        />
      );
    } else {
      // Default protected route is dashboard
      pageContent = (
        <DashboardPage
          onSignOut={() => {
            signOut();
            navigateTo('landing');
          }}
          onNavigateSettings={() => navigateTo('settings')}
        />
      );
    }
  } else {
    // Unauthenticated routes
    if (currentView === 'signin') {
      pageContent = (
        <SignInPage
          onNavigateHome={() => navigateTo('landing')}
          onNavigateSignUp={() => navigateTo('signup')}
          onSuccess={() => navigateTo('dashboard')}
        />
      );
    } else if (currentView === 'signup') {
      pageContent = (
        <SignUpPage
          onNavigateHome={() => navigateTo('landing')}
          onNavigateSignIn={() => navigateTo('signin')}
          onSuccess={() => navigateTo('dashboard')}
        />
      );
    } else if (currentView === 'dashboard' || currentView === 'settings') {
      // Unauthorized attempt to access protected pages redirects to signin
      pageContent = (
        <SignInPage
          onNavigateHome={() => navigateTo('landing')}
          onNavigateSignUp={() => navigateTo('signup')}
          onSuccess={() => navigateTo('dashboard')}
        />
      );
    } else {
      pageContent = (
        <LandingPage
          onNavigateSignIn={() => navigateTo('signin')}
          onNavigateSignUp={() => navigateTo('signup')}
        />
      );
    }
  }

  return (
    <>
      {pageContent}
      {/* Floating round Day/Night mode button at the bottom */}
      <ThemeToggle />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
