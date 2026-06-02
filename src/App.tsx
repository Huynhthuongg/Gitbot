/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  GitPullRequest, 
  Settings, 
  Bell, 
  Cpu, 
  Smartphone, 
  Monitor, 
  Database, 
  Network, 
  Calendar, 
  ArrowLeft, 
  Folder, 
  Github, 
  ChevronRight, 
  Star, 
  Menu, 
  MessageSquare,
  Sparkles,
  Info,
  Search
} from 'lucide-react';

import { Repository, PullRequest, PRComment, Pipeline, DiffFile } from './types';
import CodeDiffView from './components/CodeDiffView';
import PipelineView from './components/PipelineView';
import SchemaDiagram from './components/SchemaDiagram';
import InfrastructureMap from './components/InfrastructureMap';
import RolloutChart from './components/RolloutChart';
import CommandPalette from './components/CommandPalette';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  // Navigation / Viewport simulation mode
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Data State
  const [currentRepoId, setCurrentRepoId] = useState<number>(1);
  const pendingTargetFileRef = useRef<string | null>(null);
  const [currentPrId, setCurrentPrId] = useState<number>(124);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [activePipelineId, setActivePipelineId] = useState<number | null>(501);

  // Lists loaded from Backend API
  const [repos, setRepos] = useState<Repository[]>([]);
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [comments, setComments] = useState<PRComment[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  
  // GUI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'pr' | 'pipeline' | 'docs'>('pr');
  const [notificationMsg, setNotificationMsg] = useState<string>('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Global keydown effect for Command Palette triggers
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 1. Initial boot data fetch
  const initializeRepos = async () => {
    // Seed locally or fallback
    setRepos([
      {
        id: 1,
        name: "gitbot-runner-core",
        description: "Công cụ cốt lõi chịu trách nhiệm đọc và thực thi file cấu hình .gitbot-ci.yml",
        language: "Golang",
        stars: 342,
      },
      {
        id: 2,
        name: "gitbot-web-frontend",
        description: "Giao diện Web Responsive tối ưu hóa đa thiết bị & ứng dụng PWA",
        language: "TypeScript",
        stars: 128,
      },
      {
        id: 3,
        name: "gitbot-ssh-gate",
        description: "Cơ chế quản lý phân quyền SSH và truyền file tốc độ cao qua Git Storage",
        language: "Rust",
        stars: 87,
      }
    ]);
  };

  // Fetch PR list predicated on Repository
  const fetchPRs = async (repoId: number) => {
    try {
      // Local filter or endpoint query
      const prList: PullRequest[] = [
        { id: 124, repo_id: 1, title: "Tối ưu hóa parser đọc file yaml và sửa lỗi thực thi lệnh", source_branch: "feature/optimize-yaml", target_branch: "main", status: "open" },
        { id: 125, repo_id: 1, title: "Sửa cơ chế SSH Handshake timeout và ghi nhớ session", source_branch: "bugfix/ssh-timeout", target_branch: "main", status: "merged" },
        { id: 201, repo_id: 2, title: "Cập nhật Service Worker phục vụ chế độ cài đặt offline PWA", source_branch: "feature/pwa-support", target_branch: "main", status: "open" }
      ];
      const filtered = prList.filter(p => p.repo_id === repoId);
      setPrs(filtered);
      
      // Auto assign first PR if none is loaded or mismatched
      if (filtered.length > 0 && !filtered.some(p => p.id === currentPrId)) {
        setCurrentPrId(filtered[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch comments from endpoint
  const fetchCommentsForPR = async (repoId: number, prId: number) => {
    try {
      const res = await fetch(`/api/v1/repos/${repoId}/pulls/${prId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch diff from endpoint
  const fetchDiffForPR = async (repoId: number, prId: number, targetFilePath?: string) => {
    try {
      const res = await fetch(`/api/v1/repos/${repoId}/pulls/${prId}/diff`);
      if (res.ok) {
        const data = await res.json();
        setDiffFiles(data);
        if (data.length > 0) {
          const fileToSelect = (targetFilePath && data.some((f: any) => f.filePath === targetFilePath))
            ? targetFilePath
            : data[0].filePath;
          setSelectedFilePath(fileToSelect);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch pipelines
  const fetchPipelines = async (repoId: number) => {
    try {
      const res = await fetch(`/api/v1/repos/${repoId}/pipelines`);
      if (res.ok) {
        const data = await res.json();
        setPipelines(data);
        if (data.length > 0) {
          setActivePipelineId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Execute triggers whenever repoId or currentPrId adapts
  useEffect(() => {
    initializeRepos();
  }, []);

  useEffect(() => {
    fetchPRs(currentRepoId);
    fetchPipelines(currentRepoId);
  }, [currentRepoId]);

  useEffect(() => {
    fetchCommentsForPR(currentRepoId, currentPrId);
    const target = pendingTargetFileRef.current;
    pendingTargetFileRef.current = null;
    fetchDiffForPR(currentRepoId, currentPrId, target || undefined);
  }, [currentPrId, currentRepoId]);

  // Handle triggered pipeline status refresh callbacks
  const handleWorkflowRefresh = () => {
    fetchPipelines(currentRepoId);
    setNotificationMsg("🔔 Trạng thái Pipeline vừa tự động cập nhật!");
    setTimeout(() => setNotificationMsg(""), 3500);
  };

  const selectedRepo = repos.find(r => r.id === currentRepoId) || repos[0];
  const selectedPR = prs.find(p => p.id === currentPrId) || prs[0];

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans relative antialiasedSelection">
      
      {/* Dynamic Top bar Notification slide */}
      {notificationMsg && (
        <div className="bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-2 text-center text-xs font-semibold text-white tracking-wide shadow-md transition-all flex items-center justify-center gap-2 relative z-50">
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Global Application Nav-Header */}
      <header className="bg-[#0b0f19]/90 border-b border-slate-900 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-emerald-405 text-white rounded-lg shadow-md shadow-indigo-900/20">
            <Cpu className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-md font-bold tracking-tight text-white uppercase font-sans">Nền Tảng GitBot</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                PWA READY
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans block">Sự tiện lợi tối đa cho nhà phát triển di động & PC</span>
          </div>
        </div>

        {/* Search Command Palette Trigger Button (Desktop Only) with Shortcuts Help */}
        <div className="hidden md:flex items-center gap-2">
          <button 
            id="trigger-command-palette-header-btn"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-3 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-450 hover:text-slate-200 transition-all duration-200 ease-in-out cursor-pointer shadow-inner w-72 justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-medium font-sans">Tìm kiếm kho hoặc lệnh...</span>
            </div>
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500">
              <span>⌘K</span>
            </div>
          </button>

          {/* Quick Shortcuts Help Tooltip */}
          <div className="relative group">
            <button
              id="shortcuts-help-btn"
              className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-indigo-550 rounded-xl text-slate-500 hover:text-indigo-400 transition-all cursor-help flex items-center justify-center shadow-inner"
              aria-label="Phím tắt hệ thống"
            >
              <Info className="w-4 h-4" />
            </button>
            
            {/* Tooltip dropdown on hover */}
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-950/95 border border-slate-850 rounded-xl shadow-2xl p-4 hidden group-hover:block transition-all z-50 backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-200 font-sans">Phím tắt nhanh</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-450">Mở Hộp Lệnh</span>
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">⌘ K / Ctrl K</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-450">Đóng Hộp Lệnh</span>
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">Esc</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-450">Di chuyển lên / xuống</span>
                  <span className="bg-[#151c30] border border-indigo-500/10 px-1.5 py-0.5 rounded font-mono text-indigo-400">↑ / ↓</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-450">Chọn mục / Xác nhận</span>
                  <span className="bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded font-mono text-emerald-400">Enter</span>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-2.5 mt-2.5">
                <span className="text-[9px] text-slate-500 font-mono block text-center">Nền Tảng GitBot • Hỗ trợ bàn phím</span>
              </div>
            </div>
          </div>
        </div>

        {/* Viewport Simulation Mode Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-850">
          <button 
            id="toggle-desktop-view-btn"
            onClick={() => {
              setViewportMode('desktop');
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              viewportMode === 'desktop' 
                ? 'bg-slate-900 text-white shadow-sm border border-slate-800' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Máy tính (Desktop)</span>
          </button>
          <button 
            id="toggle-mobile-view-btn"
            onClick={() => setViewportMode('mobile')}
            className={`flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              viewportMode === 'mobile' 
                ? 'bg-slate-900 text-white shadow-sm border border-slate-800' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Giả lập Di động (Mobile Case)</span>
          </button>
        </div>
      </header>

      {/* Main Core Body */}
      {viewportMode === 'desktop' ? (
        
        /* =========================================================
           🖥️ DESKTOP VIEWPORT DESIGN (3 Cột chuẩn Kiến trúc)
           ========================================================= */
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-12 gap-6">
          
          {/* CỘT 1 (Màn hình chính bên trái): SIDEBAR ĐIỀU HƯỚNG */}
          <section className="col-span-12 md:col-span-3 flex flex-col gap-5">
            
            {/* Swapper Repositories list */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <span className="text-xs uppercase text-slate-500 font-bold font-mono tracking-wider">MÃ KHO NGUỒN (REPOS)</span>
              <div className="flex flex-col gap-2">
                {repos.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setCurrentRepoId(r.id);
                      setActiveWorkspaceTab('pr');
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-all border flex items-center justify-between group ${
                      currentRepoId === r.id 
                        ? 'bg-[#111726] text-white border-indigo-500/20' 
                        : 'bg-slate-950/20 text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="text-xs font-mono font-medium truncate max-w-[130px]">{r.name}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block truncate max-w-[150px]">{r.description}</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 text-[10px] font-mono text-slate-500">
                      <Star className="w-3 h-3 text-amber-500" />
                      <span>{r.stars}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* List of Pull Requests under Repo */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-slate-500 font-bold font-mono tracking-wider">PULL REQUESTS</span>
                <span className="text-[10px] font-mono text-slate-400">{prs.length} PRs</span>
              </div>

              {prs.length === 0 ? (
                <span className="text-xs text-slate-500 text-center py-4">Kho này hiện không có PR.</span>
              ) : (
                <div className="flex flex-col gap-2">
                  {prs.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentPrId(p.id);
                        setActiveWorkspaceTab('pr');
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-all border flex items-start gap-2.5 ${
                        currentPrId === p.id
                          ? 'bg-[#111726] text-white border-indigo-500/20 shadow-md'
                          : 'bg-slate-950/20 text-slate-400 border-transparent hover:bg-slate-900'
                      }`}
                    >
                      <GitPullRequest className={`w-4 h-4 shrink-0 mt-0.5 ${p.status === 'merged' ? 'text-purple-400' : 'text-emerald-400'}`} />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold leading-relaxed line-clamp-2">{p.title}</span>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1">
                          <span>#{p.id}</span>
                          <span className="bg-slate-950 px-1 border border-slate-850 rounded">{p.source_branch}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode auto notification / details */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-350">Dark Mode Tự Động</span>
                <span className="text-[11px] text-slate-400 leading-normal">
                  Chuyển rải sáng bối cảnh tối dựa trên hệ thống máy khách, đảm bảo đôi mắt dev luôn an tòan lúc làm việc tăng ca ban tối.
                </span>
              </div>
            </div>

          </section>

          {/* CỘT 2: NỘI DUNG CHÍNH (Workspace Tabs & Canvas) */}
          <section className="col-span-12 md:col-span-6 flex flex-col gap-5">
            
            {/* PR Info Header Summary */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl shadow-md flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-850 pb-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest">{selectedRepo?.name}</span>
                  <h2 className="text-base font-bold text-slate-100 font-sans leading-snug">
                    {selectedPR?.title || 'Công cụ tối ưu hoá yaml parser'}
                  </h2>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded font-bold tracking-wider capitalize ${
                  selectedPR?.status === 'merged' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {currentPrId === 125 ? "Merged" : "Open"}
                </span>
              </div>

              {/* Tab Navigation switches */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  id="tab-code-review-btn"
                  onClick={() => setActiveWorkspaceTab('pr')}
                  className={`text-xs font-mono px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    activeWorkspaceTab === 'pr'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold'
                      : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  Code Diff Review
                </button>
                <button
                  id="tab-pipeline-btn"
                  onClick={() => setActiveWorkspaceTab('pipeline')}
                  className={`text-xs font-mono px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    activeWorkspaceTab === 'pipeline'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-semibold'
                      : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  Pipeline CI/CD
                </button>
                <button
                  id="tab-docs-btn"
                  onClick={() => setActiveWorkspaceTab('docs')}
                  className={`text-xs font-mono px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    activeWorkspaceTab === 'docs'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 font-semibold'
                      : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  Sơ Đồ Kiến Trúc
                </button>
              </div>
            </div>

            {/* Inner Workspace Tabs container switch */}
            {activeWorkspaceTab === 'pr' && (
              <div className="flex flex-col gap-4">
                {/* File Dropdown Selector to switch files in diff files list */}
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 uppercase font-bold font-mono">Xem tệp tin:</span>
                    <div className="bg-slate-950 border border-slate-850 px-3 py-1.5 rounded">
                      <select 
                        value={selectedFilePath} 
                        onChange={(e) => setSelectedFilePath(e.target.value)}
                        className="bg-transparent text-xs font-mono text-slate-300 outline-none border-none py-0.5 cursor-pointer. outline-none font-semibold"
                      >
                        {diffFiles.map(df => (
                          <option key={df.filePath} value={df.filePath} className="bg-slate-950 text-slate-300">
                            {df.filePath} (+{df.additions}/-{df.deletions})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Nhấp đúp dòng code để viết ý kiến đóng góp</span>
                </div>

                {/* Diff engine component */}
                <CodeDiffView 
                  repoId={currentRepoId}
                  prId={currentPrId}
                  selectedFile={selectedFilePath}
                  files={diffFiles}
                  comments={comments}
                  onCommentAdded={() => fetchCommentsForPR(currentRepoId, currentPrId)}
                  isMobileMode={false}
                />
              </div>
            )}

            {activeWorkspaceTab === 'pipeline' && (
              <PipelineView 
                repoId={currentRepoId}
                pipelines={pipelines}
                activePipelineId={activePipelineId}
                onSelectPipeline={(id) => setActivePipelineId(id)}
                onRefresh={handleWorkflowRefresh}
                isMobileMode={false}
              />
            )}

            {activeWorkspaceTab === 'docs' && (
              <div className="flex flex-col gap-6">
                <SchemaDiagram />
                <InfrastructureMap />
                <RolloutChart />
              </div>
            )}

          </section>

          {/* CỘT 3 (Màn hình chính bên phải): LỘ TRÌNH & THÔNG TIN BỔ TRỢ */}
          <section className="col-span-12 md:col-span-3 flex flex-col gap-5">
            
            {/* Quick PR Detail Sidebar section */}
            <div className="bg-slate-900 border border-slate-855 rounded-xl p-4 flex flex-col gap-3 font-sans">
              <span className="text-xs uppercase text-slate-500 font-bold font-mono tracking-wider">Thông tin PR phụ</span>
              
              <div className="space-y-3.5 pt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">ASSIGNEE</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5.5 h-5.5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                      HL
                    </div>
                    <span className="text-xs text-slate-300 leading-none">hoang_lam_dev</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">LABELS</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded">
                      code-security
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                      pr-review-bot
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">MILESTONE</span>
                  <span className="text-xs text-indigo-400 font-semibold font-mono">MVP Giai Đoạn 1</span>
                </div>
              </div>
            </div>

            {/* Quick overview metrics */}
            <div className="bg-slate-900 border border-slate-855 rounded-xl p-4 flex flex-col gap-3 font-sans">
              <span className="text-xs uppercase text-slate-500 font-bold font-mono tracking-wider">Cấu hình Deployment</span>
              <div className="space-y-2 pt-1 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Hạ tầng:</span>
                  <span className="text-slate-300 font-bold">K8s Clusters</span>
                </div>
                <div className="flex justify-between">
                  <span>Replication:</span>
                  <span className="text-teal-400">3 Nodes Active</span>
                </div>
                <div className="flex justify-between">
                  <span>ReDoS Guard:</span>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Rollout Timeline widget card */}
            <RolloutChart />

          </section>

        </main>
      ) : (
        
        /* =========================================================
           📱 MOBILE VIEWPORT SIMULATION (Strict High-Fidelity Device Layout)
           ========================================================= */
        <main className="flex-1 max-w-lg w-full mx-auto p-4 flex flex-col items-center justify-center bg-transparent relative">
          
          <div className="w-full max-w-[400px] border-[12px] border-slate-900 rounded-[44px] overflow-hidden bg-[#070a13] relative shadow-2xl flex flex-col min-h-[780px]" style={{ borderWidth: '12px' }}>
            
            {/* Phone Top Bezel Camera cutout & Status Bar */}
            <div className="absolute top-0 inset-x-0 h-8 bg-slate-950 flex items-center justify-between px-6 z-50">
              {/* Left clock */}
              <span className="text-[11px] font-mono text-slate-300">12:30</span>
              {/* Dynamic camera capsule and speaker */}
              <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-850/10 shrink-0 mx-auto absolute left-1/2 -translate-x-1/2 top-1 flex items-center justify-end pr-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              </div>
              {/* Battery wifi indicators */}
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <span>LTE</span>
                <span className="text-emerald-400">● 100%</span>
              </div>
            </div>

            {/* Simulated Mobilize Header and Hamburger menu container */}
            <header className="bg-slate-900 border-b border-rose-950/20 top-8 px-4 py-3 flex items-center justify-between mt-8 relative z-30">
              <div className="flex items-center gap-1.5">
                <button 
                  id="mobile-hamburger-btn"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1 text-slate-355 hover:text-white bg-slate-950 rounded border border-slate-850 cursor-pointer"
                  title="Menu Hamburger điều hướng"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <button 
                  id="mobile-search-trigger-btn"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="p-1 text-indigo-400 hover:text-indigo-300 bg-slate-950 rounded border border-slate-850 cursor-pointer"
                  title="Mở Hộp Lệnh"
                >
                  <Search className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#5e77ff]">GITBOT REPOS</span>
                  <span className="text-xs font-bold text-slate-100 font-sans truncate max-w-[105px]">{selectedRepo?.name}</span>
                </div>
              </div>
            </header>

              {/* Quick Tab switcher in-place inside phone frame */}
              <div className="flex items-center bg-slate-950 px-1 py-0.5 rounded border border-slate-850">
                <button 
                  onClick={() => {
                    setActiveWorkspaceTab('pr');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[9px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                    activeWorkspaceTab === 'pr' ? 'bg-slate-900 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  PR
                </button>
                <button 
                  onClick={() => {
                    setActiveWorkspaceTab('pipeline');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[9px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                    activeWorkspaceTab === 'pipeline' ? 'bg-slate-900 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  CI/CD
                </button>
                <button 
                  onClick={() => {
                    setActiveWorkspaceTab('docs');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[9px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                    activeWorkspaceTab === 'docs' ? 'bg-slate-900 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Docs
                </button>
              </div>

            {/* Hamburger Siderbar Sliders over-lay on Mobile viewport simulation */}
            {isMobileMenuOpen && (
              <div id="mobile-sidebar" className="absolute inset-0 bg-[#070a13] z-40 top-[88px] p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-left duration-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">CHỌN KHO MÃ NGUỒN</span>
                <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                  {repos.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setCurrentRepoId(r.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2.5 rounded text-left text-xs font-mono transition-all border ${
                        currentRepoId === r.id 
                          ? 'bg-[#111726] border-indigo-500/30 text-white' 
                          : 'bg-slate-950/40 text-slate-400 border-transparent'
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 mt-2">BẢN REPORT PRs</span>
                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                  {prs.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentPrId(p.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2.5 rounded text-left text-xs transition-all border ${
                        currentPrId === p.id 
                          ? 'bg-[#111726] border-indigo-500/30 text-white' 
                          : 'bg-slate-950/40 text-slate-400 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-[11px] truncate">{p.title}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 block mt-0.5">#{p.id} ({p.source_branch})</span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full mt-auto py-2 bg-slate-900 hover:bg-slate-850 rounded text-center text-xs text-slate-350 cursor-pointer"
                >
                  Đóng Navigation
                </button>
              </div>
            )}

            {/* Inner Phone Screen Content scroll container */}
            <div className="flex-1 overflow-y-auto px-3.5 pt-3 pb-24 flex flex-col gap-3 z-10">
              
              {/* PR Status summary inside phone */}
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-2 shadow">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-indigo-400">PR #{selectedPR?.id}</span>
                  <span className="text-[11px] font-semibold font-sans leading-snug line-clamp-2 text-slate-200">
                    {selectedPR?.title}
                  </span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                  selectedPR?.status === 'merged' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {currentPrId === 125 ? "Merged" : "Open"}
                </span>
              </div>

              {/* Tab views conditional processing inside Mobile Frame */}
              {activeWorkspaceTab === 'pr' && (
                <div className="flex flex-col gap-3">
                  
                  {/* Dropdown File Selector as spec for Mobile */}
                  <div className="bg-[#111625] border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Tập tin:</span>
                    <div className="bg-slate-950 border border-slate-850 px-2 py-1 rounded">
                      <select 
                        value={selectedFilePath} 
                        onChange={(e) => setSelectedFilePath(e.target.value)}
                        className="bg-transparent text-[10px] font-mono text-slate-300 outline-none border-none cursor-pointer outline-none"
                      >
                        {diffFiles.map(df => (
                          <option key={df.filePath} value={df.filePath}>
                            {df.filePath} (+{df.additions}/-{df.deletions})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mobile Diff code renderer */}
                  <CodeDiffView 
                    repoId={currentRepoId}
                    prId={currentPrId}
                    selectedFile={selectedFilePath}
                    files={diffFiles}
                    comments={comments}
                    onCommentAdded={() => fetchCommentsForPR(currentRepoId, currentPrId)}
                    isMobileMode={true}
                  />

                </div>
              )}

              {activeWorkspaceTab === 'pipeline' && (
                <div className="flex flex-col gap-3">
                  <PipelineView 
                    repoId={currentRepoId}
                    pipelines={pipelines}
                    activePipelineId={activePipelineId}
                    onSelectPipeline={(id) => setActivePipelineId(id)}
                    onRefresh={handleWorkflowRefresh}
                    isMobileMode={true}
                  />
                </div>
              )}

              {activeWorkspaceTab === 'docs' && (
                <div className="flex flex-col gap-4">
                  <SchemaDiagram />
                  <InfrastructureMap />
                  <RolloutChart />
                </div>
              )}

            </div>

            {/* Action Bar (Cố định đáy trang di động): Cho phép nhập nhanh comment dòng code bất kỳ */}
            <div className="absolute bottom-4 inset-x-0 h-18 bg-slate-900 border-t border-slate-850 px-3 py-2 z-20 flex flex-col justify-center shadow-lg">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Viết nhanh bình luận chung cho PR..."
                  className="flex-grow bg-slate-950 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 outline-none focus:border-indigo-505"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const input = e.currentTarget;
                      try {
                        const res = await fetch(`/api/v1/repos/${currentRepoId}/pulls/${currentPrId}/comments`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            file_path: selectedFilePath || 'parser.go',
                            line_number: 14,
                            author: "gitbot_mobile_dev",
                            content: input.value
                          })
                        });
                        if (res.ok) {
                          input.value = '';
                          fetchCommentsForPR(currentRepoId, currentPrId);
                          setNotificationMsg("💬 Đăng bình luận nhanh thành kông!");
                          setTimeout(() => setNotificationMsg(""), 2000);
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    setNotificationMsg("💡 Gợi ý: Gõ văn bản rồi nhấn Enter trong ô nhập để gửi bình luận nhanh từ di động!");
                    setTimeout(() => setNotificationMsg(""), 3500);
                  }}
                  className="bg-indigo-650 hover:bg-indigo-600 px-3 rounded-lg text-white text-xs font-semibold cursor-pointer shrink-0 py-1.5"
                >
                  Gửi
                </button>
              </div>
              {/* Home swipe indicator line of modern smartphone layout */}
              <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2 select-none" />
            </div>

          </div>

          <span className="text-[11px] font-mono text-slate-500 mt-3 text-center">
            Màn hình 375px mô tả bọc dòng và bọc code Unified đúng quy chuẩn Section 1 & 2.
          </span>
        </main>
      )}

      {/* Primary Global App Footer */}
      <footer className="bg-[#03060c] border-t border-slate-900/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 tracking-wide font-mono mt-auto select-none">
        <span>© 2026 Nền tảng GitBot Inc. Bản quyền được bảo hộ.</span>
        <div className="flex items-center gap-4">
          <a href="#schema-diagram-container" className="hover:text-indigo-400 font-sans transition-colors">PostgreSQL Database</a>
          <span>•</span>
          <a href="#infrastructure-map-container" className="hover:text-teal-400 font-sans transition-colors">Microservice Topology</a>
          <span>•</span>
          <a href="#rollout-chart-container" className="hover:text-emerald-400 font-sans transition-colors">Rollout Program</a>
        </div>
      </footer>

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        repos={repos}
        currentRepoId={currentRepoId}
        currentPrId={currentPrId}
        onSelectRepo={(repoId) => {
          setCurrentRepoId(repoId);
          fetchPRs(repoId);
          setActiveWorkspaceTab('pr');
        }}
        onSelectPR={(repoId, prId, filePath) => {
          if (filePath) {
            pendingTargetFileRef.current = filePath;
          }
          setCurrentRepoId(repoId);
          setCurrentPrId(prId);
          setActiveWorkspaceTab('pr');
          fetchPRs(repoId);
        }}
        viewportMode={viewportMode}
        setViewportMode={setViewportMode}
        activeWorkspaceTab={activeWorkspaceTab}
        setActiveWorkspaceTab={setActiveWorkspaceTab}
        onRefreshPipelines={handleWorkflowRefresh}
      />

      <Analytics />
    </div>
  );
}
