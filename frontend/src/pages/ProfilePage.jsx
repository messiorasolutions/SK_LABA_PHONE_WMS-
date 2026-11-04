import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const formatUserId = (id) => {
  if (!id && id !== 0) return 'SK_USER_01';
  if (typeof id === 'string' && id.startsWith('SK_USER_')) return id;
  const num = parseInt(id, 10);
  if (isNaN(num)) return `SK_USER_${id}`;
  return `SK_USER_${String(num).padStart(2, '0')}`;
};

export default function ProfilePage() {
  const { user, refreshUser, updateUserLocally } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('details');

  // Profile Picture state
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // Profile Information Form
  const [displayName, setDisplayName] = useState(user?.display_name || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user?.display_name || user?.name) {
      setDisplayName(user.display_name || user.name);
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const roleTitle = user?.role === 'ADMIN' ? 'Administrator' : 'Staff Member';
  const formattedId = user?.formatted_user_id || formatUserId(user?.user_id);
  const avatarUrl = user?.avatar_url || null;

  // ── Profile Photo Upload & Resize (Frontend Only) ─────────────────
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');
    setAvatarSuccess('');

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Only JPG, PNG, and WEBP image formats are supported.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setAvatarError('Image size exceeds 3MB limit.');
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 320;
        let width = img.width;
        let height = img.height;

        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, startX, startY, size, size, 0, 0, maxSize, maxSize);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        updateUserLocally({ avatar_url: dataUrl });
        setAvatarUploading(false);
        setAvatarSuccess('Profile picture updated successfully.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      img.onerror = () => {
        setAvatarError('Failed to process image file.');
        setAvatarUploading(false);
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setAvatarError('Failed to read image file.');
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    updateUserLocally({ avatar_url: null });
    setAvatarSuccess('Profile image deleted successfully.');
    setAvatarError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Update Profile Handler (Frontend Only) ─────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setProfileError('Display name must be at least 2 characters long.');
      return;
    }
    if (trimmedName.length > 100) {
      setProfileError('Display name cannot exceed 100 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    setProfileSaving(true);
    try {
      updateUserLocally({
        display_name: trimmedName,
        name: trimmedName,
        email: trimmedEmail,
      });
      setProfileSuccess('Profile details (name and email) updated successfully.');
    } catch (err) {
      setProfileError('Unable to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change Password Handler ────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasNumber) {
      setPasswordError('New password must contain at least one uppercase letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password cannot be the same as your current password.');
      return;
    }

    setPasswordChanging(true);
    try {
      const res = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res?.success) {
        setPasswordSuccess('Password changed successfully. Please keep your credentials secure.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res?.message || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to change password. Please verify your current password.'
      );
    } finally {
      setPasswordChanging(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="-mt-3 sm:-mt-4 lg:-mt-5 space-y-3 max-w-7xl mx-auto pb-6">
      <div className="hidden">
        <style>{`
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            display: none !important;
            margin: 0 !important;
          }
          input[type=number] {
            -moz-appearance: textfield !important;
          }
        `}</style>
      </div>

      {/* ── Page Header (Clean, moved higher up) ──────────────────── */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-normal text-slate-900 dark:text-white tracking-tight leading-none">
          My Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
          View and manage your administrator account details, display name, and security settings.
        </p>
      </div>

      {/* ── Feedback Messages ──────────────────────────────────────── */}
      {profileSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-normal">{profileSuccess}</span>
          </div>
          <button onClick={() => setProfileSuccess('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {profileError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-normal">{profileError}</span>
          </div>
          <button onClick={() => setProfileError('')} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {passwordSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-normal">{passwordSuccess}</span>
          </div>
          <button onClick={() => setPasswordSuccess('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {passwordError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-normal">{passwordError}</span>
          </div>
          <button onClick={() => setPasswordError('')} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Tab Bar (Clean, no overflow-x-auto, no arrows) ──────────── */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-5">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 pb-2.5 text-xs cursor-pointer transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'details'
              ? 'border-rose-600 dark:border-rose-500 text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <User className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'details' ? 'text-rose-600 dark:text-rose-400' : ''}`} />
          <span>Profile Information</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-2.5 text-xs cursor-pointer transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'security'
              ? 'border-rose-600 dark:border-rose-500 text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Lock className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'security' ? 'text-rose-600 dark:text-rose-400' : ''}`} />
          <span>Security & Password</span>
        </button>
      </div>

      {/* ── TAB 1: Profile Information ─────────────────────────────── */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2 space-y-3.5">
            {/* 1. Profile Picture Card */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300 pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3.5 flex items-center justify-between">
                <span>Profile Picture</span>
                {avatarUploading && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-rose-600" /> Uploading...
                  </span>
                )}
              </div>

              {avatarSuccess && (
                <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{avatarSuccess}</span>
                  </div>
                  <button onClick={() => setAvatarSuccess('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {avatarError && (
                <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{avatarError}</span>
                  </div>
                  <button onClick={() => setAvatarError('')} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Clickable Avatar Preview */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group shrink-0 cursor-pointer"
                  title="Click to select new image"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-rose-50 dark:ring-rose-950/40 border border-slate-200/90 dark:border-slate-700 shadow-sm transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-black via-neutral-900 to-rose-950 text-white font-bold flex items-center justify-center text-xl shadow-sm ring-4 ring-slate-100 dark:ring-slate-800 border border-rose-900/50 transition-transform duration-200 group-hover:scale-105">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-4 h-4 drop-shadow" />
                  </div>

                  <span className="absolute bottom-0 right-0 p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 shadow-sm transition-colors">
                    <Camera className="w-3 h-3" />
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div>
                    <h4 className="text-xs font-medium text-slate-900 dark:text-white">Admin Profile Image</h4>
                    <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      {avatarUrl
                        ? 'Custom profile image is active. You can change or delete it at any time.'
                        : 'No image uploaded yet. Default initials avatar is displayed. Supports JPG, PNG, or WEBP (Max 3MB).'}
                    </p>
                  </div>

                  {/* Action Buttons: Upload & Delete */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleAvatarFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shadow-2xs cursor-pointer ${
                        avatarUrl
                          ? 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          : 'bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 shadow-sm'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{avatarUrl ? 'Change Image' : 'Upload Image'}</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-800/60 rounded-full transition-all shadow-2xs cursor-pointer"
                        title="Delete current image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Image</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Personal Details Form */}
            <form
              onSubmit={handleUpdateProfile}
              className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
            >
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                Personal Identification & Contact
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Display Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-normal text-slate-700 dark:text-slate-300">
                    Display Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Admin1"
                    required
                    minLength={2}
                    maxLength={100}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500 [appearance:textfield]"
                  />
                  <span className="text-[11px] font-normal text-slate-400 block mt-0.5">
                    This name is shown across dashboard logs, audits, and the header.
                  </span>
                </div>

                {/* Email Address (Editable) */}
                <div className="space-y-1">
                  <label className="block text-xs font-normal text-slate-700 dark:text-slate-300">
                    Registered Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin1@gmail.com"
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500 font-mono [appearance:textfield]"
                  />
                  <span className="text-[11px] font-normal text-slate-400 block mt-0.5">
                    Administrator contact and login email address.
                  </span>
                </div>

                {/* System Role (read-only) */}
                <div className="space-y-1">
                  <label className="block text-xs font-normal text-slate-700 dark:text-slate-300">
                    System Role
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-300 cursor-not-allowed [appearance:textfield]"
                  />
                  <span className="text-[11px] font-normal text-slate-400 block mt-0.5">
                    Full administrator privileges
                  </span>
                </div>

                {/* User System ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-normal text-slate-700 dark:text-slate-300">
                    User Identifier
                  </label>
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-300 font-mono">
                    {formattedId}
                  </div>
                </div>

                {/* Account Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-normal text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-normal text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Active Account</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={profileSaving || (displayName.trim() === (user?.display_name || user?.name) && email.trim() === (user?.email || ''))}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-semibold rounded-full transition-all shadow-sm border border-neutral-800 cursor-pointer disabled:from-neutral-800 disabled:via-neutral-800 disabled:to-neutral-900 disabled:text-slate-200 disabled:border-neutral-700 disabled:cursor-not-allowed"
                >
                  {profileSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span className="font-semibold text-white tracking-wide drop-shadow-2xs">
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Account Information Box */}
          <div className="space-y-3.5">
            <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                Account Information
              </div>

              <div className="space-y-2 text-xs font-normal text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Type:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">WMS Administrator</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Created:</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatDate(user?.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Login:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {user?.last_login_at ? formatDate(user.last_login_at) : 'Active Now'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Session Cookie:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">sk_laba_sid (HttpOnly)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CSRF Security:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Security & Password ─────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="max-w-2xl">
          <form
            onSubmit={handleChangePassword}
            className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5"
          >
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
              Update Account Password
            </div>

            <div className="space-y-3">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    required
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500 font-mono [appearance:textfield]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500 font-mono [appearance:textfield]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500 font-mono [appearance:textfield]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={passwordChanging || !currentPassword || !newPassword || !confirmPassword}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-semibold rounded-full transition-all shadow-sm border border-neutral-800 cursor-pointer disabled:from-neutral-800 disabled:via-neutral-800 disabled:to-neutral-900 disabled:text-slate-200 disabled:border-neutral-700 disabled:cursor-not-allowed"
              >
                {passwordChanging && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span className="font-semibold text-white tracking-wide drop-shadow-2xs">
                  {passwordChanging ? 'Updating Password...' : 'Update Password'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
