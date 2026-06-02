'use client';

import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  prTitle: string;
  status: 'open' | 'approved' | 'pending';
}

export function Header({ prTitle, status }: HeaderProps) {
  const statusColors = {
    open: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    approved: 'bg-green-500/20 text-green-300 border border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 backdrop-blur-sm">
      <div className="ml-0 md:ml-64 px-6 py-4">
        <div className="flex flex-col gap-4">
          {/* Title and status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
                  {status.toUpperCase()}
                </span>
                <h1 className="text-xl font-bold text-slate-100">{prTitle}</h1>
              </div>
              <p className="text-sm text-slate-400">PR #124 • main • 5 files changed • +234 −45</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 size-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search files, comments..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <User size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
