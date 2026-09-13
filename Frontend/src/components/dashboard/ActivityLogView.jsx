import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  ArrowUpCircle, 
  Trash2, 
  Share2, 
  Globe, 
  Cpu, 
  Loader2, 
  RefreshCw, 
  Clock 
} from 'lucide-react';
import { authFetch, apiUrl } from '../../utils/auth';

export default function ActivityLogView() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await authFetch(apiUrl('/user/activities'));
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getActivityIcon = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('upload')) return <ArrowUpCircle className="w-4 h-4 text-ds-brand" />;
    if (msg.includes('delete') || msg.includes('trash') || msg.includes('purge')) return <Trash2 className="w-4 h-4 text-ds-error" />;
    if (msg.includes('share') || msg.includes('shared')) return <Share2 className="w-4 h-4 text-ds-success" />;
    if (msg.includes('public link') || msg.includes('link settings')) return <Globe className="w-4 h-4 text-ds-text-muted" />;
    if (msg.includes('system') || msg.includes('auto-purged')) return <Cpu className="w-4 h-4 text-ds-warning" />;
    return <Activity className="w-4 h-4 text-ds-text-muted" />;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white dark:bg-ds-card border border-ds-border rounded-xl p-5 shadow-xs max-w-4xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between pb-3.5 border-b border-ds-border mb-5">
        <h2 className="text-base font-bold text-ds-text-primary flex items-center gap-2.5">
          <Activity className="w-4.5 h-4.5 text-ds-brand" />
          Audit Logs & Activity Stream
        </h2>
        <button
          onClick={() => fetchActivities(true)}
          disabled={loading || refreshing}
          className="px-2.5 py-1.5 hover:bg-ds-bg-secondary rounded-lg transition text-ds-text-muted hover:text-ds-text-primary disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium border border-ds-border"
          title="Refresh activities"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-ds-brand' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-ds-brand" />
          <p className="text-sm text-ds-text-muted">Loading audit history…</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-ds-bg-secondary border border-ds-border rounded-xl flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-ds-text-muted" />
          </div>
          <h3 className="text-sm font-bold text-ds-text-primary mb-1">No activities logged yet</h3>
          <p className="text-xs text-ds-text-muted">Perform actions like uploads, shares, and deletes to see audit logs!</p>
        </div>
      ) : (
        <div className="relative border-l border-ds-border ml-3 pl-5 space-y-3">
          {activities.map((act) => {
            const msg = act.message || '';
            let actionType = 'Action';
            let actionBadgeBg = 'bg-ds-bg-secondary text-ds-text-primary border border-ds-border';
            
            if (msg.toLowerCase().includes('upload')) {
              actionType = 'Upload';
              actionBadgeBg = 'bg-ds-brand/10 text-ds-brand border border-ds-brand/20';
            } else if (msg.toLowerCase().includes('delete') || msg.toLowerCase().includes('trash')) {
              actionType = 'Delete';
              actionBadgeBg = 'bg-ds-error/10 text-ds-error border border-ds-error/20';
            } else if (msg.toLowerCase().includes('share')) {
              actionType = 'Share';
              actionBadgeBg = 'bg-ds-success/10 text-ds-success border border-ds-success/20';
            } else if (msg.toLowerCase().includes('encrypted') || msg.toLowerCase().includes('vault')) {
              actionType = 'Security';
              actionBadgeBg = 'bg-ds-warning/10 text-ds-warning border border-ds-warning/20';
            }

            return (
              <div key={act.id} className="relative group transition-all duration-200">
                {/* Dot decoration on timeline */}
                <div className="absolute -left-[27px] top-3 bg-white dark:bg-ds-card border-2 border-ds-border group-hover:border-ds-brand w-3 h-3 rounded-full flex items-center justify-center transition-colors">
                  <span className="w-1 h-1 bg-ds-text-muted group-hover:bg-ds-brand rounded-full transition-colors" />
                </div>

                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-ds-border bg-ds-bg-secondary/50 dark:bg-ds-bg-secondary/30 hover:bg-white dark:hover:bg-ds-bg-secondary hover:shadow-xs transition duration-150">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-ds-card border border-ds-border flex items-center justify-center shrink-0 shadow-3xs">
                      {getActivityIcon(act.message)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${actionBadgeBg}`}>
                          {actionType}
                        </span>
                        <span className="text-xs font-semibold text-ds-text-primary truncate">
                          {act.message}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-ds-text-muted font-normal">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-ds-text-muted" />
                          {formatTime(act.createdAt)}
                        </span>
                        <span>•</span>
                        <span>Owner: You</span>
                        {act.folderName && (
                          <>
                            <span>•</span>
                            <span className="text-[#2563EB] dark:text-blue-400 font-medium">Folder: {act.folderName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
