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
    if (msg.includes('upload')) return <ArrowUpCircle className="w-5 h-5 text-emerald-500" />;
    if (msg.includes('delete') || msg.includes('trash') || msg.includes('purge')) return <Trash2 className="w-5 h-5 text-rose-500" />;
    if (msg.includes('share') || msg.includes('shared')) return <Share2 className="w-5 h-5 text-blue-500" />;
    if (msg.includes('public link') || msg.includes('link settings')) return <Globe className="w-5 h-5 text-sky-500" />;
    if (msg.includes('system') || msg.includes('auto-purged')) return <Cpu className="w-5 h-5 text-amber-500" />;
    return <Activity className="w-5 h-5 text-gray-500" />;
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
    <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl p-6 shadow-sm max-w-4xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#334155] mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-[#F8FAFC] flex items-center gap-2.5">
          <div className="relative">
            <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#3B82F6] rounded-full animate-ping" />
          </div>
          Audit Logs & Activity Stream
        </h2>
        <button
          onClick={() => fetchActivities(true)}
          disabled={loading || refreshing}
          className="p-2 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-xl transition text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-[#F8FAFC] disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh activities"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm text-gray-400">Loading audit history…</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#334155] border border-gray-100 dark:border-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-300 dark:text-[#94A3B8]" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC] mb-1">No activities logged yet</h3>
          <p className="text-xs text-gray-400">Perform actions like uploads, shares, and deletes to see audit logs!</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-100 dark:border-[#334155] ml-4 pl-6 space-y-6">
          {activities.map((act) => (
            <div key={act.id} className="relative group transition-all duration-300">
              {/* Dot decoration on timeline */}
              <div className="absolute -left-[35px] top-1.5 bg-white dark:bg-[#1E293B] border-2 border-gray-200 dark:border-[#334155] group-hover:border-emerald-500 w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-300">
                <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 group-hover:bg-[#3B82F6] rounded-full transition-colors duration-300" />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-gray-105/50 dark:border-[#334155] bg-gray-50/30 dark:bg-[#1E293B]/10 hover:bg-gray-50 dark:hover:bg-[#334155]/40 hover:shadow-xs transition duration-200">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                    {getActivityIcon(act.message)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-[#F8FAFC] leading-normal select-text">
                      {act.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-450 dark:text-[#94A3B8] mt-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(act.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
