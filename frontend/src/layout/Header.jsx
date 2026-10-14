import React from 'react';
import logoImg from '../assets/logo.png';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header({ toggleSidebar }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-12 border-b px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none uppercase">
            Phone Management Portal
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Dark Mode"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>

        {/* Logo Badge */}
        <img
          src={logoImg}
          alt="SK LABA Logo"
          className="w-7 h-7 object-contain bg-black border border-slate-300 dark:border-slate-700 shadow-xs"
        />
      </div>
    </header>
  );
}



