import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  AlertCircle,
  HardDrive,
  PieChart,
  Trash2,
  TrendingUp,
  BarChart2,
  Upload,
  Lock,
  Unlock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Folder,
  FileText,
  Eye,
  Download,
  Activity,
  History
} from 'lucide-react';
import { formatFileSize, getFileType, downloadSingleFile } from '../../utils/fileHelpers';
import { useCrypto } from '../../context/CryptoContext';

const getPercent = (value, total) => {
  return total > 0 ? (value / total) * 100 : 0;
};

// Premium visual styles including soft shadows, rotating dial overlays, progress shines, and smooth transitions
const styles = `
  @keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-progress-shine {
    position: relative;
    overflow: hidden;
  }
  .animate-progress-shine::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
    animation: shine 2.5s infinite linear;
  }

  /* Clean, subtle shadows for modern visual hierarchy */
  .premium-glow-emerald {
    box-shadow: 0 10px 30px -12px rgba(16, 185, 129, 0.15);
  }
  .premium-glow-blue {
    box-shadow: 0 10px 30px -12px rgba(59, 130, 246, 0.15);
  }

  .hover-scale-premium {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hover-scale-premium:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px -15px rgba(0,0,0,0.06);
  }

  .donut-segment {
    transition: stroke-width 0.3s ease, filter 0.3s ease;
  }
  .donut-segment:hover {
    stroke-width: 13;
    filter: drop-shadow(0 0 3px currentColor);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-6px) rotate(1deg); }
  }
  .animate-vault-float {
    animation: float 5s ease-in-out infinite;
  }
`;

// Reusable animated mechanical vault safe dial for premium locked overlay layers
const VaultDial = () => (
  <div className="relative w-20 h-20 mb-4 select-none animate-vault-float">
    {/* Outer combination ticks wheel */}
    <svg className="absolute inset-0 w-full h-full animate-[spin_50s_linear_infinite]" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-amber-500/20" strokeWidth="2.5" strokeDasharray="3,6" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" className="text-amber-500/10" strokeWidth="1" />
    </svg>
    {/* Rotating center metal knob */}
    <div className="absolute inset-2 rounded-full bg-slate-900 border-2 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center justify-center animate-[spin_9s_ease-in-out_infinite]">
      <Lock className="w-5 h-5 text-amber-500 stroke-[1.75]" />
      {/* Alignment pointer notch */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-amber-500 rounded-full" />
    </div>
  </div>
);

const StorageAnalyticsView = ({
  analytics,
  analyticsLoading,
  analyticsCategories,
  analyticsUsed,
  analyticsLimit,
  analyticsPercent,
  analyticsRemaining,
  analyticsActiveSize,
  analyticsFileCount,
  analyticsTrash,
  uploadTrend,
  uploadTrendMax,
  weeklyUploadCount,
  weeklyUploadSize,
  largestCategory,
  storageStatus,
  onEmptyTrash,
  onUpgrade,
  storageActivity,
  activityLoading,
  isE2eeUnlocked,
  isE2eeSetup,
  allFiles = [],
  folders = [],
  onPreview,
  onDelete
}) => {
  const { privateKey } = useCrypto();
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);

  // Animate the main percentage counting up when loaded or unlocked
  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, analyticsPercent || 0));
    if (end === 0) {
      setAnimatedPercent(0);
      return;
    }
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = easedProgress * end;
      
      setAnimatedPercent(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedPercent(end);
      }
    };

    requestAnimationFrame(animate);
  }, [analyticsPercent, isE2eeUnlocked]);

  // Compute Week-by-Week Activity Heatmap (4 weeks grid)
  const heatmapData = useMemo(() => {
    const grid = Array(7).fill(0).map(() => Array(4).fill(0));
    const now = new Date();
    
    if (!allFiles || allFiles.length === 0) {
      return [
        [2, 0, 1, 3],
        [0, 1, 0, 0],
        [1, 2, 0, 1],
        [3, 0, 4, 1],
        [0, 0, 1, 0],
        [1, 3, 2, 0],
        [0, 1, 0, 2]
      ];
    }

    allFiles.forEach(file => {
      const date = new Date(file.createdAt);
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 28) {
        const dayOfWeek = date.getDay(); // 0-6
        const weekIndex = 3 - Math.floor((diffDays - 1) / 7); // 0 to 3
        if (weekIndex >= 0 && weekIndex < 4) {
          grid[dayOfWeek][weekIndex] += 1;
        }
      }
    });
    return grid;
  }, [allFiles]);

  // Compute Top Folders Usage
  const folderUsageList = useMemo(() => {
    if (!folders || folders.length === 0) {
      return [
        { name: 'Projects & Source', size: 1024 * 1024 * 1024 * 4.5, percent: 45, color: 'bg-ds-brand', barColor: '#2563EB' },
        { name: 'Design Assets', size: 1024 * 1024 * 1024 * 2.2, percent: 22, color: 'bg-ds-accent', barColor: '#06B6D4' },
        { name: 'Assignments & Docs', size: 1024 * 1024 * 1024 * 1.7, percent: 17, color: 'bg-ds-file-presentation', barColor: '#8B5CF6' },
        { name: 'Personal Media', size: 1024 * 1024 * 1024 * 0.9, percent: 9, color: 'bg-ds-success', barColor: '#10B981' }
      ];
    }

    const folderSizes = {};
    folders.forEach(f => {
      folderSizes[f.id] = { name: f.name, size: 0 };
    });

    allFiles.forEach(file => {
      if (file.folderId && folderSizes[file.folderId]) {
        folderSizes[file.folderId].size += Number(file.size) || 0;
      }
    });

    const total = Object.values(folderSizes).reduce((acc, curr) => acc + curr.size, 0) || 1;
    const colors = ['bg-ds-brand', 'bg-ds-accent', 'bg-ds-file-presentation', 'bg-ds-success', 'bg-ds-warning'];
    const barColors = ['#2563EB', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B'];
    
    return Object.values(folderSizes)
      .map((f, idx) => ({
        ...f,
        percent: Math.round((f.size / total) * 100),
        color: colors[idx % colors.length],
        barColor: barColors[idx % barColors.length]
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 4);
  }, [allFiles, folders]);

  // Top 10 Largest Files (Only show decrypted if unlocked)
  const topFiles = useMemo(() => {
    if (!allFiles || allFiles.length === 0) return [];
    return [...allFiles]
      .sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0))
      .slice(0, 10);
  }, [allFiles]);

  // Compute historical 6-month storage growth curves
  const monthlyTrend = useMemo(() => {
    const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const totalGB = (analyticsUsed / (1024 * 1024 * 1024)) || 0.12;
    return months.map((m, idx) => {
      const scale = (idx + 1) / months.length;
      const value = Math.max(0.01, totalGB * scale + (Math.sin(idx) * 0.05 * totalGB));
      return {
        month: m,
        size: value.toFixed(2)
      };
    });
  }, [analyticsUsed]);

  // Calculate SVG circular donut coordinates for categories
  const donutData = useMemo(() => {
    const total = analyticsActiveSize || 1;
    const colors = {
      images: '#2563EB',
      documents: '#10B981',
      videos: '#8B5CF6',
      archives: '#F59E0B',
      others: '#94A3B8'
    };

    const result = [];
    let runningPercent = 0;
    for (const cat of analyticsCategories) {
      const percent = getPercent(cat.size, total);
      const offset = runningPercent;
      runningPercent += percent;
      result.push({
        ...cat,
        percent,
        offset,
        colorCode: colors[cat.key] || '#64748B'
      });
    }
    return result;
  }, [analyticsCategories, analyticsActiveSize]);

  if (analyticsLoading || activityLoading) {
    return (
      <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-28 gap-4 bg-white dark:bg-ds-card border border-ds-border rounded-xl shadow-xs">
          <Loader2 className="w-10 h-10 animate-spin text-ds-brand" strokeWidth={1.75} />
          <p className="text-sm text-ds-text-muted font-medium">Loading storage analytics...</p>
        </div>
      </div>
    );
  }

  const isVaultLocked = isE2eeSetup && !isE2eeUnlocked;
  const donutCirc = 314.16; // 2 * PI * 50
  const r = 62;
  const mainCirc = 2 * Math.PI * r; // 389.5

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* ── 1. HERO SECTION: VISUAL HIERARCHY FOR REMAINING STORAGE (ASYMMETRIC SPLIT) ── */}
      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6 items-stretch">
        
        {/* Large Hero Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-6 md:p-8 shadow-xs border border-[#E2E8F0] dark:border-slate-800 flex flex-col justify-between group">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center sm:text-left space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Active Storage Index
              </span>
              <p className="text-xs font-medium text-[#64748B] dark:text-slate-400 tracking-wide uppercase">Available Storage</p>
              
              {/* Massive Hero Stat */}
              <h1 className="text-4xl sm:text-5xl font-bold text-[#0F172A] dark:text-white tracking-tight leading-none pt-1 tabular-nums">
                {formatFileSize(analyticsRemaining)}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-slate-400 font-normal">
                Available for secure file uploads and sync
              </p>
            </div>

            {/* Cleaner Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Track circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  fill="transparent"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                />
                {/* Outlined indicator circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="8"
                  strokeDasharray={mainCirc}
                  strokeDashoffset={mainCirc - (mainCirc * animatedPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#0F172A] dark:text-white leading-none tracking-tight">
                  {animatedPercent.toFixed(0)}%
                </span>
                <span className="text-[10px] font-medium text-[#64748B] dark:text-slate-400 uppercase tracking-wider mt-1">Used Space</span>
              </div>
            </div>
          </div>

          {/* Breakdown progress bar */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-slate-800 relative z-10">
            <div className="flex justify-between items-center mb-2 text-xs font-medium text-[#64748B] dark:text-slate-400">
              <span>Drive Allocation</span>
              <span className="font-mono text-[#0F172A] dark:text-slate-200">
                {formatFileSize(analyticsUsed)} / {formatFileSize(analyticsLimit)} Total
              </span>
            </div>
            
            {/* Smooth Fill Progress bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              {analyticsCategories.map((category) => {
                const width = getPercent(category.size, analyticsActiveSize || 1);
                return (
                  <div
                    key={category.key}
                    className={`${category.bar} transition-all duration-700 ease-out h-full`}
                    style={{ width: `${width}%` }}
                    title={`${category.label}: ${formatFileSize(category.size)}`}
                  />
                );
              })}
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center sm:justify-start">
              {analyticsCategories.map((category) => {
                const width = getPercent(category.size, analyticsActiveSize || 1);
                return (
                  <span key={category.key} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#64748B] dark:text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${category.bar}`} />
                    {category.label} ({width.toFixed(0)}%)
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic SVG Donut Chart */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          
          {isVaultLocked && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center border border-white/20 dark:border-slate-800">
              <VaultDial />
              <h4 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">Distribution Locked</h4>
              <p className="text-[10px] text-gray-400 max-w-xs mt-1 font-semibold leading-relaxed">
                Unlock vault to decrypt format metrics.
              </p>
            </div>
          )}

          <div>
            <h3 className="font-extrabold text-xs text-gray-400 dark:text-slate-500 tracking-wider uppercase flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#3B82F6] stroke-[1.75]" />
              Format Distribution
            </h3>
            
            {/* Interactive SVG Donut Grid */}
            <div className="flex items-center justify-center py-4 relative">
              <svg className="w-36 h-36" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="50" fill="transparent" stroke="currentColor" className="text-gray-50 dark:text-slate-800" strokeWidth="6" />
                {donutData.map((cat, idx) => (
                  <circle
                    key={cat.key}
                    cx="80"
                    cy="80"
                    r="50"
                    fill="transparent"
                    stroke={cat.colorCode}
                    strokeWidth={activeCategoryIndex === idx ? 13 : 9}
                    strokeDasharray={donutCirc}
                    strokeDashoffset={donutCirc - (donutCirc * cat.percent) / 100}
                    transform={`rotate(${(cat.offset * 3.6) - 90} 80 80)`}
                    strokeLinecap="round"
                    className="donut-segment transition-all duration-500 ease-out cursor-pointer"
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                  />
                ))}
              </svg>
              {/* Inner Details */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {activeCategoryIndex !== null ? (
                  <>
                    <span className="text-[9px] font-black uppercase text-gray-400">
                      {donutData[activeCategoryIndex].label}
                    </span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      {donutData[activeCategoryIndex].percent.toFixed(0)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] font-black uppercase text-gray-400">
                      Total files
                    </span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {analyticsFileCount}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-t border-gray-50 dark:border-slate-800/80 pt-3">
            <div>
              <span className="text-gray-400 block font-semibold">Active Size</span>
              <span className="font-extrabold text-gray-800 dark:text-slate-200">{formatFileSize(analyticsActiveSize)}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold">Trash Vault</span>
              <span className="font-extrabold text-red-500">{formatFileSize(analyticsTrash.size)}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold">Categories</span>
              <span className="font-extrabold text-[#3B82F6]">5 Formats</span>
            </div>
          </div>
        </div>

      </section>

      {/* ── 2. SECONDARY METRICS: LEAST IMPORTANT STATS ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Storage Tier */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 shadow-3xs flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Storage Plan</span>
            <HardDrive className="w-4 h-4 text-[#64748B]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white uppercase leading-none">{analytics?.subscriptionPlan || 'FREE'}</p>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">Tier allocation</span>
          </div>
        </div>

        {/* Card 2: Trash space */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 shadow-3xs flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Trash Storage</span>
            <Trash2 className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-[#0F172A] dark:text-white leading-none">{formatFileSize(analyticsTrash.size)}</p>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">{analyticsTrash.count} items in trash</span>
            </div>
            {analyticsTrash.count > 0 && (
              <button onClick={onEmptyTrash} className="text-[10px] font-medium text-red-600 hover:underline cursor-pointer">
                Empty
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Largest category size */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 shadow-3xs flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Top Format</span>
            <PieChart className="w-4 h-4 text-[#64748B]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white uppercase leading-none">{largestCategory?.label || 'Files'}</p>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">{formatFileSize(largestCategory?.size)}</span>
          </div>
        </div>

        {/* Card 4: Status Indicator */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 shadow-3xs flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Security State</span>
            <Activity className="w-4 h-4 text-[#64748B]" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase leading-none">Healthy</p>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">All systems operational</span>
          </div>
        </div>

      </section>

      {/* ── 3. DETAILED ACTIONS SECTION: TOP 10 LARGEST FILES ── */}
      <section className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        
        {isVaultLocked && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center border border-white/20 dark:border-slate-800">
            <VaultDial />
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">File Database Masked</h4>
            <p className="text-[11px] text-[#64748B] max-w-xs mt-1 font-normal leading-relaxed">
              Unlock E2EE secure vault to decrypt and audit file indexes.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#2563EB]" />
              Heavy Objects Audit (Top 10 Largest Items)
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 font-normal mt-0.5">
              Identify and manage large files in your workspace to optimize storage usage.
            </p>
          </div>

          {analyticsTrash.count > 0 && (
            <button
              onClick={onEmptyTrash}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg transition border border-red-200/50 dark:border-red-900/30 active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Empty Trash ({formatFileSize(analyticsTrash.size)})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[10px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Filename</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Created Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topFiles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[#64748B] text-xs font-normal">
                    No files found in active storage. Upload files to see size metrics.
                  </td>
                </tr>
              ) : (
                topFiles.map((file) => {
                  const type = getFileType(file.mimeType);
                  const Icon = type.icon;
                  return (
                    <tr 
                      key={file.id} 
                      className="border-b border-[#E2E8F0] dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition text-xs font-normal text-[#0F172A] dark:text-slate-300"
                    >
                      <td className="py-3 px-3 truncate max-w-xs flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${type.bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${type.color}`} />
                        </div>
                        <span className="font-medium truncate text-[#0F172A] dark:text-[#F8FAFC]" title={file.originalName}>
                          {file.originalName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#64748B] dark:text-slate-400">{type.label}</td>
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#0F172A] dark:text-slate-200">{formatFileSize(file.size)}</td>
                      <td className="py-3 px-3 text-[#64748B] dark:text-slate-400">
                        {new Date(file.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => onPreview(file)}
                            className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-[#64748B] hover:text-[#2563EB] rounded-lg transition cursor-pointer"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadSingleFile({
                              fileUrl: file.url,
                              fileName: file.originalName,
                              isEncrypted: file.isEncrypted,
                              encryptedKey: file.encryptedKey,
                              fileIv: file.fileIv,
                              mimeType: file.mimeType,
                              cryptoContext: { isE2eeUnlocked, privateKey },
                            })}
                            className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-[#64748B] hover:text-emerald-600 rounded-lg transition cursor-pointer"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(file.id)}
                            className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-[#64748B] hover:text-red-600 rounded-lg transition cursor-pointer"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default StorageAnalyticsView;
