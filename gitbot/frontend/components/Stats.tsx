'use client';

import { GitBranch, FileText, Plus, Minus, AlertCircle } from 'lucide-react';

interface StatsProps {
  filesChanged: number;
  additions: number;
  deletions: number;
  commits: number;
}

export function Stats({ filesChanged, additions, deletions, commits }: StatsProps) {
  const statItems = [
    {
      label: 'Files Changed',
      value: filesChanged,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/30',
    },
    {
      label: 'Additions',
      value: additions,
      icon: Plus,
      color: 'text-green-400',
      bgColor: 'bg-green-950/30',
    },
    {
      label: 'Deletions',
      value: deletions,
      icon: Minus,
      color: 'text-red-400',
      bgColor: 'bg-red-950/30',
    },
    {
      label: 'Commits',
      value: commits,
      icon: GitBranch,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`${item.bgColor} border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{item.label}</p>
              <Icon size={16} className={item.color} />
            </div>
            <p className="text-2xl font-bold text-slate-100">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}
