import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-150">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-2.5 sm:p-3 lg:p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>

  );
}
