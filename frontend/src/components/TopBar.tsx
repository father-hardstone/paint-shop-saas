import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  User as UserIcon, 
  LogOut, 
  Store, 
  Mail, 
  Phone, 
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getBackendOrigin } from '../config/api';

interface TopBarProps {
  onSignOut: () => void;
  onNavigateSettings?: () => void;
  onNavigateDashboard?: () => void;
  isPublic?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onSignOut, 
  onNavigateSettings,
  onNavigateDashboard,
  isPublic = false
}) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const backendOrigin = getBackendOrigin();
  
  // Icon and Name replacement rule:
  // Public routes: ALWAYS show Paintly icon & Paintly name.
  // Dashboard / Protected routes: show app icon & Paintly UNLESS the store icon or store name is uploaded.
  const hasStoreLogo = !isPublic && Boolean(user?.companyLogo);
  const hasStoreName = !isPublic && Boolean(user?.shopName);

  const resolveImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${backendOrigin}${path}`;
  };

  const displayLogoUrl = hasStoreLogo ? resolveImageUrl(user?.companyLogo) : null;
  const displayName = hasStoreName ? user?.shopName : 'Paintly';

  const profileImgSrc = resolveImageUrl(user?.profilePicture);

  return (
    <header className="border-b border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/90 backdrop-blur-xl sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={onNavigateDashboard} 
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          {displayLogoUrl ? (
            <img 
              src={displayLogoUrl} 
              alt={displayName} 
              className="h-9 w-9 rounded-full object-cover border border-slate-700 dark:border-slate-700 light:border-slate-300 shadow-md"
            />
          ) : (
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Palette className="h-5 w-5 text-white" />
            </div>
          )}

          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent">
              {displayName}
            </span>
            {/* Show subtitle if store name replaced Paintly and user has address */}
            {hasStoreName && user?.shopAddress ? (
              <span className="text-xs block text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {user.shopAddress}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right side: Circular profile avatar (simply clicking opens dropdown, no chevron, no extra buttons) */}
        {!isPublic && (
          <div className="relative" ref={dropdownRef}>
            <button
              id="user-profile-circle-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full p-0 border-2 border-slate-700 dark:border-slate-700 light:border-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer overflow-hidden flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
              aria-expanded={dropdownOpen}
              title="Account Menu"
            >
              {profileImgSrc ? (
                <img 
                  src={profileImgSrc} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                </div>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div 
                id="user-profile-dropdown"
                className="absolute right-0 mt-2 w-72 bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* User info in dropdown header */}
                <div className="px-4 py-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                  {user?.name ? (
                    <p className="font-semibold text-white dark:text-white light:text-slate-900 truncate">{user.name}</p>
                  ) : null}
                  
                  {user?.shopName ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{user.shopName}</span>
                    </div>
                  ) : null}

                  {user?.email ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  ) : null}

                  {user?.phone ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono">{user.phone}</span>
                    </div>
                  ) : null}
                </div>

                <div className="px-2 py-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onNavigateSettings) onNavigateSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 rounded-xl transition-colors text-left font-medium cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>Shop Settings</span>
                  </button>
                </div>

                {/* Log Out at the end */}
                <div className="pt-1.5 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 px-2">
                  <button
                    id="logout-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
