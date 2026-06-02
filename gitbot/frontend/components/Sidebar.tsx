'use client';

import { useState } from 'react';
import { Menu, X, GitBranch, Settings, LogOut } from 'lucide-react';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 z-40`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GitBranch size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">GitBot</h1>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <div className="space-y-2">
            <a
              href="#"
              className="block px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Pull Requests
            </a>
            <a
              href="#"
              className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Repositories
            </a>
            <a
              href="#"
              className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
            >
              My Reviews
            </a>
            <a
              href="#"
              className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Analytics
            </a>
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            <Settings size={18} />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
