'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DiffViewer } from '@/components/DiffViewer';
import { Stats } from '@/components/Stats';
import { FileFilter } from '@/components/FileFilter';
import { ApprovalPanel } from '@/components/ApprovalPanel';

interface DiffLine {
  type: 'addition' | 'deletion' | 'neutral';
  content: string;
  line_num: number;
}

interface FileDiff {
  file_path: string;
  lines: DiffLine[];
}

export default function GitBotDiffPage() {
  const [diffData, setDiffData] = useState<FileDiff[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileDiff[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch từ Backend Go
    fetch('http://localhost:8080/api/v1/diff')
      .then((res) => res.json())
      .then((data) => {
        setDiffData(data);
        setFilteredFiles(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[v0] Error fetching diff:', err);
        setIsLoading(false);
      });
  }, []);

  const handleFilterChange = (filteredFilePaths: string[]) => {
    const filtered = diffData.filter((file) => filteredFilePaths.includes(file.file_path));
    setFilteredFiles(filtered);
  };

  const calculateStats = () => {
    let additions = 0;
    let deletions = 0;

    diffData.forEach((file) => {
      file.lines.forEach((line) => {
        if (line.type === 'addition') additions++;
        if (line.type === 'deletion') deletions++;
      });
    });

    return {
      filesChanged: diffData.length,
      additions,
      deletions,
      commits: 3,
    };
  };

  const stats = calculateStats();
  const filePaths = diffData.map((f) => f.file_path);

  // Transform data to match DiffViewer interface
  const viewerFiles = filteredFiles.map((file) => ({
    filePath: file.file_path,
    lines: file.lines,
    additions: file.lines.filter((l) => l.type === 'addition').length,
    deletions: file.lines.filter((l) => l.type === 'deletion').length,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <Header prTitle="Optimize security mechanism for Login" status={approvalStatus} />

      <main className="ml-0 md:ml-64 pt-24 pb-32 px-4 md:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats */}
          <Stats {...stats} />

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter sidebar */}
            <div className="lg:col-span-1">
              <FileFilter files={filePaths} onFilterChange={handleFilterChange} />
            </div>

            {/* Diff viewer */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-400">Loading diff...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex items-center justify-center py-12 border border-slate-700 rounded-lg bg-slate-900/50">
                  <p className="text-slate-400">No files match your filters</p>
                </div>
              ) : (
                <DiffViewer files={viewerFiles} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Approval panel */}
      <ApprovalPanel
        currentStatus={approvalStatus}
        onApprove={() => setApprovalStatus('approved')}
        onRequestChanges={() => setApprovalStatus('rejected')}
      />
    </div>
  );
}
