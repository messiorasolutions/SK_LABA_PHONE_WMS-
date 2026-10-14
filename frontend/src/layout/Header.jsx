import React from 'react';
import { COLORS } from '../constants/colors';
import logoImg from '../assets/logo.png';
import { Bell, Search, Menu, Sparkles } from 'lucide-react';

export default function Header({ toggleSidebar }) {
  return (
    <header
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
      className="h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          style={{ color: COLORS.muted }}
          className="p-1.5 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block w-72 md:w-80">
          <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search phones, brands, specs..."
            style={{
              backgroundColor: COLORS.background,
              borderColor: COLORS.border,
              color: COLORS.foreground,
            }}
            className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          style={{ color: COLORS.muted }}
          className="relative p-2 rounded-xl hover:text-[#1D4ED8] hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span
            style={{ backgroundColor: COLORS.secondary }}
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white"
          />
        </button>

        <div style={{ backgroundColor: COLORS.border }} className="h-5 w-px mx-0.5" />

        {/* Logo Badge */}
        <div className="flex items-center gap-2">
          <img
            src={logoImg}
            alt="SK LABA Logo"
            className="w-8 h-8 rounded-lg object-contain bg-black border border-slate-200 shadow-sm"
          />
        </div>
      </div>
    </header>
  );
}
