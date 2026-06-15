/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Folder,
  GitPullRequest,
  Terminal,
  Settings,
  X,
  Monitor,
  Smartphone,
  Activity,
  FileText,
  ChevronRight,
  Sparkles,
  Command
} from 'lucide-react';
import { Repository, PullRequest } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  repos: Repository[];
  currentRepoId: number;
  currentPrId: number;
  onSelectRepo: (repoId: number) => void;
  onSelectPR: (repoId: number, prId: number, targetFilePath?: string) => void;
  viewportMode: 'desktop' | 'mobile';
  setViewportMode: (mode: 'desktop' | 'mobile') => void;
  activeWorkspaceTab: 'wiki' | 'dashboard' | 'pr' | 'pipeline' | 'docs';
  setActiveWorkspaceTab: (tab: 'wiki' | 'dashboard' | 'pr' | 'pipeline' | 'docs') => void;
  onRefreshPipelines: () => void;
}

interface PaletteAction {
  id: string;
  category: 'ACTION';
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  run: () => void;
}

interface PalettePRFile {
  pr_id: number;
  repo_id: number;
  filePath: string;
  title: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  repos,
  currentRepoId,
  currentPrId,
  onSelectRepo,
  onSelectPR,
  viewportMode,
  setViewportMode,
  activeWorkspaceTab,
  setActiveWorkspaceTab,
  onRefreshPipelines,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Complete list of PRs across all repositories to search globally
  const allPullRequests: PullRequest[] = [
    {
      id: 124,
      repo_id: 1,
      title: "Tối ưu hóa parser đọc file yaml và sửa lỗi thực thi lệnh tùy ý",
      source_branch: "feature/optimize-yaml-parser",
      target_branch: "main",
      status: "open"
    },
    {
      id: 125,
      repo_id: 1,
      title: "Sửa cơ chế SSH Handshake timeout và ghi nhớ session",
      source_branch: "bugfix/ssh-timeout",
      target_branch: "main",
      status: "merged"
    },
    {
      id: 201,
      repo_id: 2,
      title: "Cập nhật Service Worker phục vụ chế độ cài đặt offline PWA",
      source_branch: "feature/pwa-support",
      target_branch: "main",
      status: "open"
    }
  ];

  // Specific file paths belonging to each Pull Request for deep-linking
  const prFiles: PalettePRFile[] = [
    { pr_id: 124, repo_id: 1, filePath: "parser.go", title: "parser.go" },
    { pr_id: 124, repo_id: 1, filePath: ".gitbot-ci.yml", title: ".gitbot-ci.yml" },
    { pr_id: 125, repo_id: 1, filePath: "ssh/handshake.go", title: "ssh/handshake.go" },
    { pr_id: 201, repo_id: 2, filePath: "src/serviceWorker.ts", title: "src/serviceWorker.ts" }
  ];

  // Actions
  const actions: PaletteAction[] = [
    {
      id: 'tab-wiki',
      category: 'ACTION',
      title: "Mở Wiki GitBot",
      subtitle: "Xem tài liệu vận hành, CI/CD, bảo mật và checklist deploy",
      icon: FileText,
      run: () => {
        setActiveWorkspaceTab('wiki');
        onClose();
      }
    },
    {
      id: 'tab-dashboard',
      category: 'ACTION',
      title: "Xem Dashboard Tổng Quan",
      subtitle: "Theo dõi PR, pipeline, bảo mật và rollout trong một màn hình",
      icon: Sparkles,
      run: () => {
        setActiveWorkspaceTab('dashboard');
        onClose();
      }
    },
    {
      id: 'tab-pr',
      category: 'ACTION',
      title: "Xem Code Diff Review",
      subtitle: "Chuyển sang tab đánh giá kiểm định mã nguồn",
      icon: Terminal,
      run: () => {
        setActiveWorkspaceTab('pr');
        onClose();
      }
    },
    {
      id: 'tab-pipeline',
      category: 'ACTION',
      title: "Xem Pipeline CI/CD",
      subtitle: "Kiểm tra tiến trình build/test/deploy tự động",
      icon: Activity,
      run: () => {
        setActiveWorkspaceTab('pipeline');
        onClose();
      }
    },
    {
      id: 'tab-docs',
      category: 'ACTION',
      title: "Xem Sơ đồ Kiến trúc & Database",
      subtitle: "Xem sơ đồ PostgreSQL và cấu trúc Microservices",
      icon: FileText,
      run: () => {
        setActiveWorkspaceTab('docs');
        onClose();
      }
    },
    {
      id: 'mode-desktop',
      category: 'ACTION',
      title: "Đổi sang chế độ Máy tính (Desktop)",
      subtitle: "Hiển thị tối ưu cho màn hình rộng PC 3 cột chuẩn",
      icon: Monitor,
      run: () => {
        setViewportMode('desktop');
        onClose();
      }
    },
    {
      id: 'mode-mobile',
      category: 'ACTION',
      title: "Đổi sang giả lập Di động (Mobile)",
      subtitle: "Hiển thị khung hình di động thon gọn chân thực",
      icon: Smartphone,
      run: () => {
        setViewportMode('mobile');
        onClose();
      }
    },
    {
      id: 'refresh-pipeline',
      category: 'ACTION',
      title: "Cập nhật Pipeline CI/CD",
      subtitle: "Yêu cầu hệ thống đọc lại trạng thái công việc mới nhất",
      icon: Settings,
      run: () => {
        onRefreshPipelines();
        onClose();
      }
    }
  ];

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle global key events for shortcuts and controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Toggle palette
        if (isOpen) onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Recency and Visits Persistence logic
  const [visits, setVisits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('command_palette_visits');
        if (stored) {
          setVisits(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Lỗi khi đọc lịch sử truy cập', e);
      }
    }
  }, [isOpen]);

  const trackVisit = (type: string, id: string) => {
    const visitKey = `${type}:${id}`;
    const newVisits = {
      ...visits,
      [visitKey]: Date.now()
    };
    setVisits(newVisits);
    try {
      localStorage.setItem('command_palette_visits', JSON.stringify(newVisits));
    } catch (e) {
      console.error(e);
    }
  };

  const getRecencyTimestamp = (item: any) => {
    let visitKey = '';
    if (item.type === 'REPO') {
      visitKey = `REPO:${item.data.id}`;
    } else if (item.type === 'PR') {
      visitKey = `PR:${item.data.id}`;
    } else if (item.type === 'PR_FILE') {
      visitKey = `PR_FILE:${item.data.pr_id}:${item.data.filePath}`;
    } else if (item.type === 'ACTION') {
      visitKey = `ACTION:${item.data.id}`;
    }
    return visits[visitKey] || 0;
  };

  // Filter items
  const normalizedQuery = searchQuery.toLowerCase().trim();

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(normalizedQuery) ||
    repo.description.toLowerCase().includes(normalizedQuery) ||
    repo.language.toLowerCase().includes(normalizedQuery)
  );

  const filteredPRs = allPullRequests.filter(pr => {
    const parentRepo = repos.find(r => r.id === pr.repo_id);
    const repoName = parentRepo ? parentRepo.name.toLowerCase() : '';
    return pr.title.toLowerCase().includes(normalizedQuery) ||
           pr.source_branch.toLowerCase().includes(normalizedQuery) ||
           pr.id.toString().includes(normalizedQuery) ||
           repoName.includes(normalizedQuery);
  });

  const filteredPRFiles = prFiles.filter(item => {
    const parentPR = allPullRequests.find(p => p.id === item.pr_id);
    const prTitle = parentPR ? parentPR.title.toLowerCase() : '';
    return item.filePath.toLowerCase().includes(normalizedQuery) ||
           item.title.toLowerCase().includes(normalizedQuery) ||
           prTitle.includes(normalizedQuery);
  });

  const filteredActions = actions.filter(act =>
    act.title.toLowerCase().includes(normalizedQuery) ||
    act.subtitle.toLowerCase().includes(normalizedQuery)
  );

  // Group all filtered elements for single navigation scroll indexing list
  const combinedItemsWithoutRank: (
    | { type: 'REPO'; data: Repository }
    | { type: 'PR'; data: PullRequest }
    | { type: 'PR_FILE'; data: PalettePRFile }
    | { type: 'ACTION'; data: PaletteAction }
  )[] = [
    ...filteredRepos.map(r => ({ type: 'REPO' as const, data: r })),
    ...filteredPRs.map(p => ({ type: 'PR' as const, data: p })),
    ...filteredPRFiles.map(f => ({ type: 'PR_FILE' as const, data: f })),
    ...filteredActions.map(a => ({ type: 'ACTION' as const, data: a }))
  ];

  // Rank results based on 'recency' (most recently visited items first)
  const combinedItems = [...combinedItemsWithoutRank].sort((a, b) => {
    const timeA = getRecencyTimestamp(a);
    const timeB = getRecencyTimestamp(b);
    if (timeA !== timeB) {
      return timeB - timeA; // Descending: highest timestamp (most recent) first
    }
    // Stable Priority: Repos -> PRs -> Files -> Actions
    const prio: Record<string, number> = { REPO: 1, PR: 2, PR_FILE: 3, ACTION: 4 };
    return (prio[a.type] || 0) - (prio[b.type] || 0);
  });

  // Adjust selection if query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Navigate lists with Keyboard Up/Down/Enter/Escape globally while open
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (combinedItems.length === 0 ? 0 : (prev + 1) % combinedItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (combinedItems.length === 0 ? 0 : (prev - 1 + combinedItems.length) % combinedItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = combinedItems[selectedIndex];
        if (activeItem) {
          handleSelect(activeItem);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [isOpen, onClose, combinedItems, selectedIndex]);

  // Auto-scroll selected item into viewport
  useEffect(() => {
    if (isOpen) {
      const selectedElement = document.getElementById(`palette-item-${selectedIndex}`);
      selectedElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex, isOpen]);

  const handleSelect = (item: typeof combinedItems[number]) => {
    if (item.type === 'REPO') {
      onSelectRepo(item.data.id);
      trackVisit('REPO', item.data.id.toString());
    } else if (item.type === 'PR') {
      onSelectPR(item.data.repo_id, item.data.id);
      trackVisit('PR', item.data.id.toString());
    } else if (item.type === 'PR_FILE') {
      onSelectPR(item.data.repo_id, item.data.pr_id, item.data.filePath);
      trackVisit('PR_FILE', `${item.data.pr_id}:${item.data.filePath}`);
    } else if (item.type === 'ACTION') {
      item.data.run();
      trackVisit('ACTION', item.data.id);
    }
    onClose();
  };

  // Motion variants for items
  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 500, damping: 30 }
    },
    exit: { opacity: 0, y: -4, transition: { duration: 0.1 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 overflow-hidden"
        >
          {/* Backdrop Blur overlay with motion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Palette Box with elegant transitions */}
          <motion.div
            id="global-command-palette"
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            ref={containerRef}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[60vh] overflow-hidden"
          >
            {/* Input Search Form Area */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/40 relative">
              <Search className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                id="command-palette-search-input"
                ref={inputRef}
                type="text"
                placeholder="Tìm kiếm kho, pull request, tệp tin hoặc hành động nhanh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none border-none py-1.5 focus:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
                <span>ESC</span>
              </div>
            </div>

            {/* List entries scrolling view */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar max-h-[350px]">
              <AnimatePresence mode="popLayout">
                {combinedItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-10 flex flex-col items-center justify-center gap-2"
                  >
                    <Command className="w-8 h-8 text-slate-600 animate-pulse" />
                    <span className="text-sm font-medium text-slate-450 font-sans">Không tìm thấy kết quả nào trùng khớp</span>
                    <span className="text-xs text-slate-500 font-mono">Dùng từ khóa khác: "yaml", "go", "worker", "ssh"</span>
                  </motion.div>
                ) : (
                  <motion.div layout className="space-y-1">
                    {combinedItems.map((item, idx) => {
                      const isSelected = idx === selectedIndex;

                      // REPO Render
                      if (item.type === 'REPO') {
                        const r = item.data;
                        const isCurrent = currentRepoId === r.id;
                        return (
                          <motion.div
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            key={`repo-${r.id}`}
                            id={`palette-item-${idx}`}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={() => handleSelect(item)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer relative overflow-hidden ${
                              isSelected ? 'text-white' : 'hover:bg-slate-950/10 text-slate-350'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="palette-hover-bg"
                                className="absolute inset-x-0 inset-y-0 bg-[#151c30] border-l-2 border-indigo-500 z-0"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            )}

                            <div className="flex items-center gap-3 truncate relative z-10">
                              <Folder className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'} shrink-0`} />
                              <div className="flex flex-col truncate">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold">{r.name}</span>
                                  <span className="bg-slate-950/60 font-mono text-[9px] text-[#5e77ff] px-1.5 py-0.5 rounded border border-slate-800">
                                    {r.language}
                                  </span>
                                  {isCurrent && (
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-bold px-1 rounded border border-emerald-500/20">
                                      đang chọn
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 truncate mt-0.5">{r.description}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 relative z-10">
                              <span className="bg-slate-950/80 text-slate-450 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                Kho mã nguồn
                              </span>
                              <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isSelected ? 'translate-x-0.5 text-slate-400' : ''}`} />
                            </div>
                          </motion.div>
                        );
                      }

                      // PR Render
                      if (item.type === 'PR') {
                        const pr = item.data;
                        const isCurrent = currentPrId === pr.id;
                        const parentRepo = repos.find(r => r.id === pr.repo_id);
                        return (
                          <motion.div
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            key={`pr-${pr.id}`}
                            id={`palette-item-${idx}`}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={() => handleSelect(item)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer relative overflow-hidden ${
                              isSelected ? 'text-white' : 'hover:bg-slate-950/10 text-slate-350'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="palette-hover-bg"
                                className="absolute inset-x-0 inset-y-0 bg-[#151c30] border-l-2 border-indigo-500 z-0"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            )}

                            <div className="flex items-center gap-3 truncate relative z-10">
                              <GitPullRequest className={`w-4 h-4 shrink-0 ${
                                pr.status === 'merged'
                                  ? 'text-purple-400'
                                  : isSelected ? 'text-emerald-400' : 'text-slate-500'
                              }`} />
                              <div className="flex flex-col truncate">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold leading-normal truncate max-w-[280px] sm:max-w-[340px]">
                                    {pr.title}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500 shrink-0">#{pr.id}</span>
                                  {isCurrent && (
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-bold px-1 rounded border border-emerald-500/20">
                                      đang xem
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1">
                                  <span className="text-indigo-400 font-bold">{parentRepo?.name || `repo-${pr.repo_id}`}</span>
                                  <span>•</span>
                                  <span className="bg-slate-950 px-1 rounded border border-slate-850">{pr.source_branch}</span>
                                  <span>→</span>
                                  <span className="bg-slate-950 px-1 rounded border border-slate-850">{pr.target_branch}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 relative z-10">
                              <span className="bg-purple-950/40 text-purple-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-950/60 shrink-0">
                                Pull Request
                              </span>
                              <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isSelected ? 'translate-x-0.5 text-slate-400' : ''}`} />
                            </div>
                          </motion.div>
                        );
                      }

                      // PR_FILE Render
                      if (item.type === 'PR_FILE') {
                        const file = item.data;
                        const parentPR = allPullRequests.find(p => p.id === file.pr_id);
                        const isCurrentActive = currentPrId === file.pr_id && activeWorkspaceTab === 'pr';
                        return (
                          <motion.div
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            key={`pr-file-${file.pr_id}-${file.filePath}`}
                            id={`palette-item-${idx}`}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={() => handleSelect(item)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer relative overflow-hidden ${
                              isSelected ? 'text-white' : 'hover:bg-slate-950/10 text-slate-350'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="palette-hover-bg"
                                className="absolute inset-x-0 inset-y-0 bg-[#151c30] border-l-2 border-indigo-500 z-0"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            )}

                            <div className="flex items-center gap-3 truncate relative z-10">
                              <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                              <div className="flex flex-col truncate">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-slate-100">{file.filePath}</span>
                                  {isCurrentActive && (
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-bold px-1 rounded border border-emerald-500/20">
                                      đang mở
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                                  Thuộc PR: {parentPR?.title || `PR #${file.pr_id}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 relative z-10">
                              <span className="bg-emerald-950/40 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-950/60 shrink-0">
                                Tệp mã nguồn
                              </span>
                              <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isSelected ? 'translate-x-0.5 text-slate-400' : ''}`} />
                            </div>
                          </motion.div>
                        );
                      }

                      // ACTION Render
                      if (item.type === 'ACTION') {
                        const action = item.data;
                        const IconComponent = action.icon;
                        return (
                          <motion.div
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            key={`action-${action.id}`}
                            id={`palette-item-${idx}`}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={() => handleSelect(item)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer relative overflow-hidden ${
                              isSelected ? 'text-white' : 'hover:bg-slate-950/10 text-slate-350'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="palette-hover-bg"
                                className="absolute inset-x-0 inset-y-0 bg-[#151c30] border-l-2 border-indigo-500 z-0"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            )}

                            <div className="flex items-center gap-3 truncate relative z-10">
                              <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col truncate">
                                <span className="text-xs font-semibold">{action.title}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">{action.subtitle}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 relative z-10">
                              {action.id.startsWith('mode-') ? (
                                <span className="bg-indigo-950/40 text-indigo-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-indigo-950/60 shrink-0">
                                  Giao diện
                                </span>
                              ) : action.id.startsWith('tab-') ? (
                                <span className="bg-purple-950/40 text-purple-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-950/60 shrink-0">
                                  Hành động
                                </span>
                              ) : (
                                <span className="bg-slate-950/60 text-slate-450 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                  Công cụ
                                </span>
                              )}
                              <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isSelected ? 'translate-x-0.5 text-slate-400' : ''}`} />
                            </div>
                          </motion.div>
                        );
                      }

                      return null;
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Keyboard Guide Footer bar */}
            <div className="bg-slate-950 border-t border-slate-800/60 px-4 py-3 flex items-center justify-between text-[11px] text-slate-500 font-sans tracking-wide">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[9px] font-mono">↑↓</span> Di chuyển</span>
                <span className="flex items-center gap-1"><span className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[9px] font-mono">Enter</span> Chọn tệp/lệnh</span>
                <span className="flex items-center gap-1"><span className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[9px] font-mono">Esc</span> Đóng</span>
              </div>
              <div className="flex items-center gap-1">
                <Command className="w-3 h-3 text-indigo-400" />
                <span className="font-mono text-[10px]">Ctrl + K / ⌘K</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
