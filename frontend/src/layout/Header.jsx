import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Search,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Header({ toggleSidebar }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

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

  const displayName = user?.display_name || user?.name || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  // Get simple breadcrumb title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/profile') || path.startsWith('/my-profile')) return 'My Profile';
    if (path.startsWith('/phone-management') || path.startsWith('/phones')) return 'Phone Management';
    if (path.startsWith('/stock-management') || path.startsWith('/stock') || path.startsWith('/storage-management')) return 'Stock Management';
    if (path.startsWith('/offers') || path.startsWith('/offer-management')) return 'Offers Management';
    if (path.startsWith('/installment-plans') || path.startsWith('/installments')) return 'Installment Plans Management';
    if (path.startsWith('/inquiries')) return 'Customer Inquiries';
    if (path.startsWith('/reservations')) return 'Customer Reservations';
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
            <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400 absolute left-3.5 pointer-events-none transition-colors duration-150" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search dashboard..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/70 hover:bg-slate-100/90 focus:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800/80 dark:focus:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded-full text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-2 focus:ring-rose-500/10 transition-all duration-200 shadow-2xs"
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

      {/* Right Controls: Theme Toggle & Avatar Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Direct Link to My Profile (Avatar only) */}
        <Link
          to="/profile"
          className={`relative shrink-0 p-0.5 rounded-full transition-all cursor-pointer block ${
            location.pathname === '/profile' || location.pathname === '/my-profile'
              ? 'ring-2 ring-rose-600 dark:ring-rose-400'
              : 'hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600'
          }`}
          title="My Profile"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-white dark:ring-slate-900 border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-black via-neutral-900 to-rose-950 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-1 ring-white dark:ring-slate-900 border border-rose-900/50"
              style={{ borderRadius: '9999px' }}
            >
              {initial}
            </div>
          )}
          <span
            className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"
            style={{ borderRadius: '9999px' }}
          />
        </Link>
      </div>
    </header>
  );
}
