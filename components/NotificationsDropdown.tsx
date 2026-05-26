import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Bell, X, Calendar, Activity, User, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsDropdown() {
  const { leads, activityLogs, pollActivityLogs, currentUser, addToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'followups' | 'team'>('followups');
  const router = useRouter();
  
  const [followUps, setFollowUps] = useState<any[]>([]);
  const prevLogsRef = useRef<string[]>([]);
  const hasInitializedRef = useRef(false);

  // HTML5 Notification Permission request
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  // Sync follow ups
  useEffect(() => {
    if (!leads) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueLeads = leads.filter(l => {
      if (!l.next_followup_date || l.stage === 'Converted' || l.stage === 'Lost') return false;
      const fDate = new Date(l.next_followup_date);
      fDate.setHours(0, 0, 0, 0);
      return fDate.getTime() <= today.getTime();
    });

    setFollowUps(dueLeads);

    if (dueLeads.length > 0 && !sessionStorage.getItem('notified_leads')) {
      addToast(`You have ${dueLeads.length} lead follow-up(s) due today!`, 'info');
      sessionStorage.setItem('notified_leads', 'true');
    }
  }, [leads, addToast]);

  // Set up periodic polling for team activity logs (syncs every 25 seconds)
  useEffect(() => {
    pollActivityLogs();
    const interval = setInterval(() => {
      pollActivityLogs();
    }, 25000);
    return () => clearInterval(interval);
  }, [pollActivityLogs]);

  // Monitor logs for new items & trigger HTML5 native push notifications
  useEffect(() => {
    if (!activityLogs || activityLogs.length === 0 || !currentUser) return;

    const currentLogIds = activityLogs.map(log => log.id);

    // Initial load: just record existing log IDs so we don't trigger spammed notifications on load
    if (!hasInitializedRef.current) {
      prevLogsRef.current = currentLogIds;
      hasInitializedRef.current = true;
      return;
    }

    // Identify brand new logs
    const newLogs = activityLogs.filter(log => !prevLogsRef.current.includes(log.id));

    if (newLogs.length > 0) {
      newLogs.forEach(log => {
        const anyLog = log as any;
        // Trigger alert only if it was performed by another coworker
        if (anyLog.user_id !== currentUser.id) {
          const logTime = new Date(anyLog.created_at).getTime();
          const threeMinutesAgo = Date.now() - 3 * 60 * 1000;

          // Double check if log was created recently (within last 3 minutes) to ensure freshness
          if (logTime >= threeMinutesAgo) {
            // 1. Native HTML5 Push Notification (runs in background!)
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(`Trackam CRM Alert: ${anyLog.action}`, {
                body: `${anyLog.user_name || 'A team member'} ${anyLog.description}`,
                icon: '/favicon.ico'
              });
            }
            // 2. In-App Toast Alert
            addToast(`${anyLog.user_name || 'Coworker'} ${anyLog.action.toLowerCase()}: ${anyLog.description}`, 'success');
          }
        }
      });

      // Update seen list
      prevLogsRef.current = currentLogIds;
    }
  }, [activityLogs, currentUser, addToast]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {(followUps.length > 0) && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-85 bg-white dark:bg-[#0d0d1a] border border-slate-100 dark:border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 flex flex-col max-h-[480px]">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Workspace Alerts</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/1">
              <button
                onClick={() => setActiveTab('followups')}
                className={cn(
                  "flex-1 py-2.5 text-center text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5",
                  activeTab === 'followups'
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-350"
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                Tasks ({followUps.length})
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={cn(
                  "flex-1 py-2.5 text-center text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5",
                  activeTab === 'team'
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-350"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                Team Feed
              </button>
            </div>
            
            {/* Scrollable List Body */}
            <div className="overflow-y-auto flex-1 min-h-[220px]">
              {activeTab === 'followups' ? (
                followUps.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {followUps.map(lead => (
                      <div 
                        key={lead.id} 
                        className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors cursor-pointer"
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/leads');
                        }}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 p-1.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Follow up with {lead.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">{lead.company}</p>
                            <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-1 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due: {formatDate(lead.next_followup_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-6 text-center">
                    <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No pending follow-ups</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">All of your tasks are fully complete!</p>
                  </div>
                )
              ) : (
                activityLogs && activityLogs.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {(activityLogs.slice(0, 15) as any[]).map(log => (
                      <div 
                        key={log.id} 
                        className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 p-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-lg shrink-0 flex items-center justify-center w-8 h-8">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {log.user_name || 'Workspace User'}
                            </p>
                            <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">
                              <span className="font-semibold text-slate-750 dark:text-slate-300">{log.action}</span>: {log.description}
                            </p>
                            <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-1 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(log.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-6 text-center">
                    <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No workspace activities</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">Activities will populate as team performs actions.</p>
                  </div>
                )
              )}
            </div>
            
            {/* Footer */}
            <div className="p-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
              <button 
                onClick={() => { 
                  setIsOpen(false); 
                  if (activeTab === 'followups') {
                    router.push('/leads');
                  } else {
                    router.push('/settings'); // Or wherever activities list is detailed
                  }
                }}
                className="w-full text-center text-xs font-black text-emerald-600 dark:text-emerald-450 hover:text-emerald-700 py-1.5 uppercase tracking-wider"
              >
                {activeTab === 'followups' ? 'Manage Calendar Leads' : 'Dismiss Alerts'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
