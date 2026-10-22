import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Upload, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

interface SettingsPageProps {
  onSignOut: () => void;
  onNavigateDashboard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onSignOut,
  onNavigateDashboard,
}) => {
  const { user, token, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [shopAddress, setShopAddress] = useState(user?.shopAddress || '');

  // Field names: Phone Number and Email. Whichever was used to login is locked, other is open.
  const isPhoneLocked = user?.primaryType === 'phone';
  const isEmailLocked = user?.primaryType === 'email';

  const [phone, setPhone] = useState(
    isPhoneLocked ? (user?.primaryCommunication || '') : (user?.phone || '')
  );
  const [email, setEmail] = useState(
    isEmailLocked ? (user?.primaryCommunication || '') : (user?.email || '')
  );

  // Images state
  const backendOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  const resolveImg = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${backendOrigin}${url}`;
  };
  const currentProfileImg = resolveImg(user?.profilePicture);
  const currentLogoImg = resolveImg(user?.companyLogo);

  const [profilePreview, setProfilePreview] = useState<string | null>(currentProfileImg);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoImg);

  const [profileBase64, setProfileBase64] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatus({ success: false, message: 'Profile picture must be under 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfilePreview(result);
      setProfileBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatus({ success: false, message: 'Shop logo must be under 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setLogoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const payload: any = {
        name,
        shopName,
        shopAddress,
        phone,
        email,
      };

      if (profileBase64) {
        payload.profilePictureBase64 = profileBase64;
      }
      if (logoBase64) {
        payload.companyLogoBase64 = logoBase64;
      }

      const res = await fetch(`${apiUrl}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings.');
      }

      updateUser(data.user);
      setStatus({ success: true, message: 'Settings saved successfully!' });
      setProfileBase64(null);
      setLogoBase64(null);
    } catch (err: any) {
      setStatus({ success: false, message: err.message || 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-slate-950 dark:bg-slate-950 light:bg-slate-100 text-slate-100 dark:text-slate-100 light:text-slate-900 font-sans overflow-hidden">
      <TopBar 
        onSignOut={onSignOut} 
        onNavigateDashboard={onNavigateDashboard}
        onNavigateSettings={() => {}}
      />

      {/* Main Single Display View (No scrolling on large screens) */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 w-full flex flex-col justify-center py-2 sm:py-4">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-300 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateDashboard}
              className="p-1.5 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
                Shop Settings
              </h1>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                Store ID: #{user?.serialNumber}
              </span>
            </div>
          </div>

          {status && (
            <div className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 ${
              status.success 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {status.success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{status.message}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3 shrink-0">
          
          {/* Top Row: Picture & Logo Uploads side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            {/* Profile Picture */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 dark:bg-slate-900/70 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-4">
              <div className="relative shrink-0">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 border border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                    <UserIcon className="w-7 h-7" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full cursor-pointer shadow-md transition-transform hover:scale-105">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 block">
                  Profile Picture
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 block truncate">
                  Upload personal avatar
                </span>
              </div>
            </div>

            {/* Shop Logo */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 dark:bg-slate-900/70 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-4">
              <div className="relative shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 dark:bg-slate-800 light:bg-slate-200 border border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-full cursor-pointer shadow-md transition-transform hover:scale-105">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 block">
                  Shop / Business Logo
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 block truncate">
                  Replaces Paintly app icon in top bar
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields arranged in compact multi-column rows (single screen view) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 dark:bg-slate-900/70 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3">
            
            {/* Row 1: Phone Number & Email (whichever was used to sign up is locked, other is open) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field: Phone Number */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <span>Phone Number</span>
                    {isPhoneLocked && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-[9px] text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked (Login ID)
                      </span>
                    )}
                  </label>
                  {!isPhoneLocked && (
                    <span className="text-[10px] text-slate-500">0300 1111111</span>
                  )}
                </div>
                <input
                  type="tel"
                  value={phone}
                  readOnly={isPhoneLocked}
                  disabled={isPhoneLocked}
                  onChange={(e) => setPhone(e.target.value.slice(0, 30))}
                  placeholder="0300 1111111"
                  className={`w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm transition-colors ${
                    isPhoneLocked
                      ? 'bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-100 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-300 text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono cursor-not-allowed select-none'
                      : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500'
                  }`}
                />
              </div>

              {/* Field: Email */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <span>Email Address</span>
                    {isEmailLocked && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-[9px] text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked (Login ID)
                      </span>
                    )}
                  </label>
                  {!isEmailLocked && (
                    <span className="text-[10px] text-slate-500">owner@store.pk</span>
                  )}
                </div>
                <input
                  type="email"
                  value={email}
                  readOnly={isEmailLocked}
                  disabled={isEmailLocked}
                  onChange={(e) => setEmail(e.target.value.slice(0, 80))}
                  placeholder="owner@paintshop.pk"
                  className={`w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm transition-colors ${
                    isEmailLocked
                      ? 'bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-100 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-300 text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono cursor-not-allowed select-none'
                      : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>

            {/* Row 2: Person's Name & Shop/Business Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 block mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 60))}
                  maxLength={60}
                  className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 block mb-1">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value.slice(0, 70))}
                  maxLength={70}
                  className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Row 3: Shop/Business Address */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700">
                  Shop / Business Address
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Max 120 chars</span>
              </div>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value.slice(0, 120))}
                maxLength={120}
                className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-1 shrink-0">
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 bg-slate-950 dark:bg-slate-950 light:bg-white py-3 text-center text-xs text-slate-500 mt-auto shrink-0 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Paintly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
