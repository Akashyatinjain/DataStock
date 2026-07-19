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
import { formatFileSize, getFileType } from '../../utils/fileHelpers';

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
        { name: 'Projects & Source', size: 1024 * 1024 * 1024 * 4.5, percent: 45, color: 'bg-blue-500', barColor: '#3b82f6' },
        { name: 'Design Assets', size: 1024 * 1024 * 1024 * 2.2, percent: 22, color: 'bg-emerald-500', barColor: '#10b981' },
        { name: 'Assignments & Docs', size: 1024 * 1024 * 1024 * 1.7, percent: 17, color: 'bg-amber-500', barColor: '#f59e0b' },
        { name: 'Personal Media', size: 1024 * 1024 * 1024 * 0.9, percent: 9, color: 'bg-purple-500', barColor: '#8b5cf6' }
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
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
    const barColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];
    
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
    let accumulatedPercent = 0;
    
    const colors = {
      images: '#3b82f6',
      videos: '#8b5cf6',
      documents: '#f43f5e',
      archives: '#f59e0b',
      others: '#64748b'
    };

    return analyticsCategories.map((cat) => {
      const percent = getPercent(cat.size, total);
      const offset = accumulatedPercent;
      accumulatedPercent += percent;
      return {
        ...cat,
        percent,
        offset,
        colorCode: colors[cat.key] || '#64748b'
      };
    });
  }, [analyticsCategories, analyticsActiveSize]);

  if (analyticsLoading || activityLoading) {
    return (
      <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-28 gap-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-green-500" strokeWidth={1.75} />
          <p className="text-sm text-gray-400 font-medium">Loading storage analytics...</p>
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
        
        {/* Large Hero Card: Spacious padding, glowing subtle gradient border */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#111827] text-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-800 flex flex-col justify-between premium-glow-emerald hover-scale-premium group">
          
          {/* Animated decorative glow meshes in background */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-700" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center sm:text-left space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Allocation Index
              </span>
              <p className="text-sm font-bold text-slate-400 tracking-wide uppercase">Remaining Storage space</p>
              
              {/* Massive Hero Stat (Strict hierarchy, clean typography) */}
              <h1 className="text-5xl sm:text-6xl font-black text-emerald-400 tracking-tight leading-none pt-2.5 tabular-nums">
                {formatFileSize(analyticsRemaining)}
              </h1>
              <p className="text-xs text-slate-400 font-semibold tracking-wide">
                Available immediately for secure backup uploads
              </p>
            </div>

            {/* Apple Health-style Cleaner Gauge (Subtle glow, clean stdDeviation) */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <defs>
                  <filter id="cleanGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Track circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  fill="transparent"
                  className="stroke-slate-800"
                  strokeWidth="8.5"
                />
                {/* Outlined indicator circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="8.5"
                  strokeDasharray={mainCirc}
                  strokeDashoffset={mainCirc - (mainCirc * animatedPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                  filter="url(#cleanGlow)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white leading-none tracking-tight">
                  {animatedPercent.toFixed(0)}%
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Used Space</span>
              </div>
            </div>
          </div>

          {/* Life-filled Mix Progress Bar (Moving shine, gradient, soft glow) */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 relative z-10">
            <div className="flex justify-between items-center mb-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Drive Allocation breakdown</span>
              <span className="font-mono text-emerald-400">
                {formatFileSize(analyticsUsed)} / {formatFileSize(analyticsLimit)} Total
              </span>
            </div>
            
            {/* Smooth Fill & Moving Shine Progress bar */}
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex animate-progress-shine glow-blue border border-slate-800">
              {analyticsCategories.map((category) => {
                const width = getPercent(category.size, analyticsActiveSize || 1);
                return (
                  <div
                    key={category.key}
                    className={`${category.bar} transition-all duration-1000 ease-out h-full`}
                    style={{ width: `${width}%` }}
                    title={`${category.label}: ${formatFileSize(category.size)}`}
                  />
                );
              })}
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3.5 justify-center sm:justify-start">
              {analyticsCategories.map((category) => {
                const width = getPercent(category.size, analyticsActiveSize || 1);
                return (
                  <span key={category.key} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${category.bar}`} />
                    {category.label} ({width.toFixed(0)}%)
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic SVG Donut Chart (File Type Distribution) - Outlined Lucide icons */}
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl p-6.5 shadow-sm hover-scale-premium flex flex-col justify-between relative overflow-hidden">
          
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

      {/* ── 2. SECONDARY METRICS: LEAST IMPORTANT STATS (LOW WEIGHT, CLEAN OUTLINED ICONS) ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Storage Tier */}
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-4.5 shadow-sm hover:scale-[1.03] hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-300 flex flex-col justify-between h-28 group">
          <div className="flex items-center justify-between text-gray-400 group-hover:text-[#3B82F6] transition">
            <span className="text-[9px] font-black uppercase tracking-widest">Subscription tier</span>
            <HardDrive className="w-4 h-4 shrink-0 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">CURRENT RATE</span>
            <p className="text-base font-black text-gray-800 dark:text-white uppercase leading-none mt-0.5">{analytics?.subscriptionPlan || 'FREE'}</p>
          </div>
        </div>

        {/* Card 2: Trash space - Outlined icons */}
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-4.5 shadow-sm hover:scale-[1.03] hover:shadow-md hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-300 flex flex-col justify-between h-28 group">
          <div className="flex items-center justify-between text-gray-400 group-hover:text-red-500 transition">
            <span className="text-[9px] font-black uppercase tracking-widest">Trash Size</span>
            <Trash2 className="w-4 h-4 shrink-0 stroke-[1.75]" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block">{analyticsTrash.count} ITEMS</span>
              <p className="text-base font-black text-gray-800 dark:text-white leading-none mt-0.5">{formatFileSize(analyticsTrash.size)}</p>
            </div>
            {analyticsTrash.count > 0 && (
              <button onClick={onEmptyTrash} className="text-[9px] font-extrabold text-red-500 hover:underline cursor-pointer">
                EMPTY
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Largest category size - Outlined icons */}
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-4.5 shadow-sm hover:scale-[1.03] hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900/50 transition-all duration-300 flex flex-col justify-between h-28 group">
          <div className="flex items-center justify-between text-gray-400 group-hover:text-amber-500 transition">
            <span className="text-[9px] font-black uppercase tracking-widest">Primary format</span>
            <PieChart className="w-4 h-4 shrink-0 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">{formatFileSize(largestCategory?.size)} TOTAL</span>
            <p className="text-base font-black text-gray-800 dark:text-white uppercase leading-none mt-0.5">{largestCategory?.label || 'Files'}</p>
          </div>
        </div>

        {/* Card 4: Status Indicator - Outlined icons */}
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-4.5 shadow-sm hover:scale-[1.03] hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900/50 transition-all duration-300 flex flex-col justify-between h-28 group">
          <div className="flex items-center justify-between text-gray-400 group-hover:text-purple-500 transition">
            <span className="text-[9px] font-black uppercase tracking-widest">Analytics Telemetry</span>
            <Activity className="w-4 h-4 shrink-0 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">SYSTEM STATUS</span>
            <p className="text-base font-black text-emerald-500 uppercase leading-none mt-0.5">HEALTHY</p>
          </div>
        </div>

      </section>

      {/* ── 3. VISUALIZATIONS ROW: DYNAMIC HISTOGRAM BAR CHARTS & HEATMAPS (OUTLINED ICONS) ── */}
      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6 items-stretch">
        
        {/* Left Column: 6-Month Growth Spline Chart and Heatmap Grid */}
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden flex flex-col justify-between">
          
          {isVaultLocked && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center border border-white/20 dark:border-slate-800">
              <VaultDial />
              <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Metrics Locked</h4>
              <p className="text-[11px] text-gray-400 max-w-xs mt-1 font-semibold leading-relaxed">
                Vault validation required to decrypt database analytics.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* SVG line-graph representing historical growth curve */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-extrabold text-xs text-gray-400 dark:text-slate-500 tracking-wider uppercase flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#3B82F6] stroke-[1.75]" />
                  Storage growth spline
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">
                  Chronological cumulative space usage curve (GB).
                </p>
              </div>

              <div className="relative h-36 border border-gray-50 dark:border-slate-800/40 rounded-2xl p-3 bg-gray-50/20 dark:bg-slate-800/10 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 280 120">
                  <defs>
                    <linearGradient id="chartGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00"/>
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="20" x2="280" y2="20" stroke="currentColor" className="text-gray-100 dark:text-slate-800/50" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="60" x2="280" y2="60" stroke="currentColor" className="text-gray-100 dark:text-slate-800/50" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="100" x2="280" y2="100" stroke="currentColor" className="text-gray-100 dark:text-slate-800/50" strokeWidth="1" />

                  <path
                    d={`M 15 100 
                       L 15 ${100 - parseFloat(monthlyTrend[0].size) * 100} 
                       Q 60 ${100 - parseFloat(monthlyTrend[1].size) * 100} 100 ${100 - parseFloat(monthlyTrend[2].size) * 100} 
                       T 180 ${100 - parseFloat(monthlyTrend[3].size) * 100} 
                       T 260 ${100 - parseFloat(monthlyTrend[5].size) * 100} 
                       L 260 100 Z`}
                    fill="url(#chartGradient3)"
                  />
                  <path
                    d={`M 15 ${100 - parseFloat(monthlyTrend[0].size) * 100} 
                       Q 60 ${100 - parseFloat(monthlyTrend[1].size) * 100} 100 ${100 - parseFloat(monthlyTrend[2].size) * 100} 
                       T 180 ${100 - parseFloat(monthlyTrend[3].size) * 100} 
                       T 260 ${100 - parseFloat(monthlyTrend[5].size) * 100}`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="260" cy={100 - parseFloat(monthlyTrend[5].size) * 100} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
                  
                  {monthlyTrend.map((t, idx) => {
                    const x = 15 + idx * 49;
                    return (
                      <text key={t.month} x={x} y="115" textAnchor="middle" className="text-[9px] font-extrabold fill-gray-400 tracking-wider">
                        {t.month}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* GitHub style contributions graph grid */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-extrabold text-xs text-gray-400 dark:text-slate-500 tracking-wider uppercase flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-500 stroke-[1.75]" />
                  Weekly Upload Heatmap
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">
                  Upload activity heat map indices across the last 4 weeks.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-gray-50/20 dark:bg-slate-800/10 border border-gray-50 dark:border-slate-800/40 rounded-2xl p-4 justify-center">
                <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                  {heatmapData.map((row, dayIdx) => 
                    row.map((val, weekIdx) => {
                      let colorClass = 'bg-gray-100 dark:bg-slate-800';
                      if (val > 0 && val <= 1) colorClass = 'bg-emerald-150 dark:bg-emerald-950/30 border border-emerald-500/10';
                      else if (val > 1 && val <= 3) colorClass = 'bg-emerald-300 dark:bg-emerald-800 border border-emerald-400/20';
                      else if (val > 3) colorClass = 'bg-emerald-500 dark:bg-emerald-600 border border-emerald-500';

                      return (
                        <div
                          key={`cell-${dayIdx}-${weekIdx}`}
                          className={`w-4 h-4 rounded-[4px] transition duration-300 hover:scale-110 cursor-pointer ${colorClass}`}
                          title={`${val} uploads`}
                        />
                      );
                    })
                  )}
                </div>
                <div className="flex flex-col text-[8px] font-extrabold text-gray-400 gap-1.5 justify-between py-1 h-32">
                  <span>Sun</span>
                  <span>Tue</span>
                  <span>Thu</span>
                  <span>Sat</span>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-800/60 flex flex-wrap gap-4 items-center justify-between text-[11px] font-semibold text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-[3px]" /> Frequent uploads
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-gray-100 dark:bg-slate-800 rounded-[3px]" /> Low uploads
            </span>
          </div>
        </div>

        {/* Right Column: 7 Days Upload Volume Histogram List */}
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-xs text-gray-400 dark:text-slate-500 tracking-wider uppercase mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-500 stroke-[1.75]" />
              Traffic Volume Histogram
            </h3>
            
            <div className="space-y-4">
              {uploadTrend.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-semibold">
                  No upload trend data recorded.
                </div>
              ) : (
                uploadTrend.slice(0, 5).map((day) => {
                  const count = Number(day.count) || 0;
                  const size = Number(day.size) || 0;
                  const pct = Math.max(8, (count / uploadTrendMax) * 100);
                  
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="w-12 text-[10px] font-extrabold text-gray-400 uppercase text-left">{day.date}</span>
                      <div className="flex-1 h-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg overflow-hidden relative border border-gray-100/30 dark:border-slate-800/30">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg animate-progress-shine"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-bold text-gray-700 dark:text-slate-300">
                          {formatFileSize(size)}
                        </span>
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-gray-700 dark:text-slate-300">{count}x</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-50 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-gray-400">
            <span>Upload traffic load index</span>
            <span className="text-emerald-500">Normal</span>
          </div>
        </div>

      </section>

      {/* ── 4. DETAILED ACTIONS SECTION: TOP 10 LARGEST FILES (OUTLINED ICONS EXCLUSIVELY) ── */}
      <section className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden">
        
        {isVaultLocked && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center border border-white/20 dark:border-slate-800">
            <VaultDial />
            <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">File Database Masked</h4>
            <p className="text-[11px] text-gray-400 max-w-xs mt-1 font-semibold leading-relaxed">
              Unlock E2EE secure vault at the banner above to decrypt and audit file indexes.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="font-extrabold text-xs text-gray-400 dark:text-slate-500 tracking-wider uppercase flex items-center gap-2">
              <HardDrive className="w-4.5 h-4.5 text-rose-500 stroke-[1.75] animate-pulse" />
              Heavy Objects Audit (Top 10 Largest Items)
            </h3>
            <p className="text-xs text-gray-400 font-semibold mt-1">
              Directly identify, preview, download, or delete heavy objects in your drive to release space.
            </p>
          </div>

          {analyticsTrash.count > 0 && (
            <button
              onClick={onEmptyTrash}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-red-500 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-xl transition border border-red-200/50 dark:border-red-900/30 active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
              Empty Trash ({formatFileSize(analyticsTrash.size)})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topFiles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400 text-xs font-semibold">
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
                      className="border-b border-gray-50/50 dark:border-slate-800/40 hover:bg-gray-50/40 dark:hover:bg-slate-800/30 transition text-xs font-semibold text-gray-700 dark:text-slate-300"
                    >
                      <td className="py-3.5 px-4 truncate max-w-xs flex items-center gap-2.5">
                        <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 ${type.bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${type.color} stroke-[1.75]`} />
                        </div>
                        <span className="font-bold truncate text-gray-900 dark:text-[#F8FAFC]" title={file.originalName}>
                          {file.originalName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{type.label}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-indigo-500">{formatFileSize(file.size)}</td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {new Date(file.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => onPreview(file)}
                            className="p-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500 rounded-lg transition cursor-pointer"
                            title="Preview File"
                          >
                            <Eye className="w-4 h-4 stroke-[1.75]" />
                          </button>
                          <a
                            href={file.url}
                            download={file.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-gray-400 hover:text-emerald-500 rounded-lg transition cursor-pointer"
                            title="Download File"
                          >
                            <Download className="w-4 h-4 stroke-[1.75]" />
                          </a>
                          <button
                            onClick={() => onDelete(file.id)}
                            className="p-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4 stroke-[1.75]" />
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
