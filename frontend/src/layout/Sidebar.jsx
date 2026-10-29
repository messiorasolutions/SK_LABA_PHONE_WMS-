import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import {
  MessageSquare,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
      navigate('/login');
    }
  };

  const isUsersActive = location.pathname.startsWith('/users');
  const isInquiriesActive = location.pathname.startsWith('/inquiries');

  const displayName = user?.display_name || user?.name || 'Admin';
  const userInitial = displayName.charAt(0).toUpperCase();
  const userRole = user?.role
    ? user.role.toLowerCase() === 'admin'
      ? 'ADMINISTRATOR'
      : user.role.toUpperCase()
    : 'ADMINISTRATOR';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-950 p-1.5 flex items-center justify-center border border-slate-800 shadow-sm shrink-0 overflow-hidden">
            <img
              src={logoImg}
              alt="SK Laaba Phone"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="overflow-hidden leading-tight flex-1 min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-black text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">
                SK
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Laaba Phone
              </span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mt-0.5">
              South Korea
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 py-4 px-3 overflow-y-auto">
          <nav className="space-y-1.5 text-xs">
            {/* 1. User & Role Management */}
            {isAdmin && (
              <NavLink
                to="/users"
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                    isUsersActive
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                {isUsersActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563eb] dark:bg-blue-500 rounded-r-full" />
                )}
                <Shield
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isUsersActive
                      ? 'text-[#2563eb] dark:text-blue-400'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">User & Role Management</span>
              </NavLink>
            )}

            {/* 2. Customer Inquiries */}
            <NavLink
              to="/inquiries"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isInquiriesActive
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isInquiriesActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563eb] dark:bg-blue-500 rounded-r-full" />
              )}
              <MessageSquare
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isInquiriesActive
                    ? 'text-[#2563eb] dark:text-blue-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Customer Inquiries</span>
            </NavLink>
          </nav>
        </div>

        {/* Minimal Footer User Profile Card */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
          <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 ring-2 ring-white dark:ring-slate-800"
                style={{ borderRadius: '9999px' }}
              >
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                    {displayName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-blink shrink-0 shadow-[0_0_5px_rgba(16,185,129,0.6)]" />
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="inline-block text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-full border border-blue-200/60 dark:border-blue-900/60 leading-tight"
                  >
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
