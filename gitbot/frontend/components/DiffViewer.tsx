'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Check, Eye } from 'lucide-react';

interface DiffLine {
  type: 'addition' | 'deletion' | 'neutral';
  content: string;
  lineNum: number;
}

interface FileDiffProps {
  filePath: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

interface DiffViewerProps {
  files: FileDiffProps[];
}

export function DiffViewer({ files }: DiffViewerProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(files.map((f) => f.filePath))
  );
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  const toggleFile = (filePath: string) => {
    const newSet = new Set(expandedFiles);
    if (newSet.has(filePath)) {
      newSet.delete(filePath);
    } else {
      newSet.add(filePath);
    }
    setExpandedFiles(newSet);
  };

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.filePath}
          className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50 hover:border-slate-600 transition-colors"
        >
          {/* File header */}
          <button
            onClick={() => toggleFile(file.filePath)}
            className="w-full px-4 py-3 flex items-center justify-between bg-slate-800 hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 text-left">
              {expandedFiles.has(file.filePath) ? (
                <ChevronDown size={20} className="text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronUp size={20} className="text-slate-400 group-hover:text-slate-300" />
              )}
              <div className="flex-1">
                <p className="font-mono text-sm font-semibold text-slate-100">{file.filePath}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-400 font-medium">+{file.additions}</span>
                <span className="text-red-400 font-medium">-{file.deletions}</span>
              </div>
            </div>
          </button>

          {/* Diff content */}
          {expandedFiles.has(file.filePath) && (
            <div className="overflow-x-auto text-xs font-mono leading-relaxed">
              {file.lines.map((line, idx) => {
                const lineKey = `${file.filePath}:${idx}`;
                const isSelected = selectedLine === lineKey;

                let bgColor = 'hover:bg-slate-800';
                let textColor = 'text-slate-400';
                let borderColor = '';

                if (line.type === 'addition') {
                  bgColor = 'bg-green-950/30 hover:bg-green-950/50';
                  textColor = 'text-green-300';
                  borderColor = 'border-l-4 border-green-500';
                } else if (line.type === 'deletion') {
                  bgColor = 'bg-red-950/30 hover:bg-red-950/50';
                  textColor = 'text-red-300';
                  borderColor = 'border-l-4 border-red-500';
                }

                return (
                  <div key={idx}>
                    <div
                      className={`${bgColor} ${borderColor} flex items-stretch group cursor-pointer transition-colors`}
                      onClick={() => setSelectedLine(isSelected ? null : lineKey)}
                    >
                      {/* Line number */}
                      <div className="flex-shrink-0 w-12 text-right pr-3 pl-2 py-1 bg-slate-900/50 border-r border-slate-700 text-slate-500 select-none">
                        {line.lineNum}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 px-4 py-1 whitespace-pre-wrap break-words ${textColor}`}>
                        {line.content}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 px-2 py-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                          title="Comment on this line"
                        >
                          <MessageSquare size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Comment section */}
                    {isSelected && (
                      <div className="bg-slate-800/50 border-t border-slate-700 px-4 py-3 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                          autoFocus
                        />
                        <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
                          Comment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
