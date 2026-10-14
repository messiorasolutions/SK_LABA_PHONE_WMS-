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
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
        }}
        className={`fixed top-0 left-0 z-40 h-screen w-64 border-r flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div
            style={{ borderColor: COLORS.border }}
            className="h-16 flex items-center gap-3 px-5 border-b bg-white"
          >
            <img
              src={logoImg}
              alt="SK LABA PHONE"
              className="w-10 h-10 rounded-lg object-contain bg-black border border-slate-200 shadow-xs shrink-0"
            />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-sm tracking-wider text-slate-900 leading-none">
                  SK LABA
                </h2>
                <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                  KOREA
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 mt-1 block">
                ලාබ ෆෝන් WMS
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Warehouse Modules
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-l-4 ${
                      isActive
                        ? 'bg-red-50 text-red-600 border-red-600 font-bold shadow-xs'
                        : 'border-transparent text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-600'
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

        {/* Footer */}
        <div
          style={{ borderColor: COLORS.border }}
          className="p-4 border-t bg-slate-50 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-600">API Status: Live</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v1.0</span>
        </div>
      </aside>
    </>
  );
}
