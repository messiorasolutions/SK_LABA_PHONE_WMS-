import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Search,
  ChevronDown,
  LogOut,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Header({ toggleSidebar }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Shortcut Ctrl + K or Cmd + K to focus search
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }

    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
      navigate('/login');
    }
  };

  const displayName = user?.display_name || user?.name || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  // Get simple breadcrumb title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/inquiries')) return 'Customer Inquiries';
    if (path.startsWith('/users')) return 'User & Role Management';
    return 'WMS Portal';
  };

  return (
    <header className="h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={toggleSidebar}
          className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer rounded-full transition-colors"
          title="Toggle Navigation"
          type="button"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="relative hidden sm:block">
          <div className="group relative flex items-center transition-all duration-200 w-60 sm:w-64 md:w-72 focus-within:w-72 sm:focus-within:w-80 md:focus-within:w-96">
            <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#2563eb] dark:group-focus-within:text-blue-400 absolute left-3.5 pointer-events-none transition-colors duration-150" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search dashboard..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/70 hover:bg-slate-100/90 focus:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800/80 dark:focus:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded-full text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Current Section Badge on mobile */}
        <span className="sm:hidden text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
          {getPageTitle()}
        </span>
      </div>

      {/* Right Controls: Status, Theme, Notifications & User Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Warehouse Badge */}

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Avatar & Dropdown Pill (Clean & Minimal: Admin and User Management moved to bottom) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            type="button"
            className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer border ${
              dropdownOpen
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/40 shadow-xs'
                : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border-slate-200/80 dark:border-slate-800'
            }`}
            style={{ borderRadius: '9999px' }}
          >
            {/* Avatar Circle */}
            <div className="relative shrink-0">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-1 ring-white dark:ring-slate-900"
                style={{ borderRadius: '9999px' }}
              >
                {initial}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"
                style={{ borderRadius: '9999px' }}
              />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {displayName}
              </div>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-0.5 ${
                dropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
              }`}
            />
          </button>

          {/* Simple User Menu Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 rounded-2xl z-50 text-xs overflow-hidden animate-popover">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {user?.email || 'admin@sklabaphone.com'}
                </p>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left font-semibold cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-100/80 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
