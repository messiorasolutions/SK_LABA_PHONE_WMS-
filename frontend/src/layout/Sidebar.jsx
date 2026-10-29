import React from 'react';
import { NavLink } from 'react-router-dom';
import { COLORS } from '../constants/colors';
import logoImg from '../assets/logo.png';
import { Smartphone } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  // Add new sidebar items here in the future
  const navItems = [
    { name: 'Phone Management', path: '/phone-management', icon: Smartphone },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-12 flex items-center gap-2.5 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <img
              src={logoImg}
              alt="SK LABA PHONE"
              className="w-7 h-7 object-contain bg-black border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
            />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 leading-none">
                <h2 className="font-black text-xs tracking-wider text-slate-900 dark:text-slate-100">
                  SK LABA
                </h2>
                <span className="text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 px-1 py-0.2 border border-red-200 dark:border-red-900">
                  KOREA
                </span>
              </div>
              <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 block leading-none">
                ලාබ ෆෝන් WMS
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all border-l-4 ${
                      isActive
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-600 font-bold shadow-xs'
                        : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-600'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

      </aside>

    </>
  );
}
