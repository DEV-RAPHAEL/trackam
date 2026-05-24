import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Bell, X, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NotificationsDropdown() {
  const { leads, addToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const [followUps, setFollowUps] = useState<any[]>([]);

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

    // If there are due leads, maybe show a toast once per session
    if (dueLeads.length > 0 && !sessionStorage.getItem('notified_leads')) {
      addToast(`You have ${dueLeads.length} lead(s) to follow up with today!`, 'info');
      sessionStorage.setItem('notified_leads', 'true');
    }
  }, [leads, addToast]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {followUps.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {followUps.length} New
              </span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {followUps.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {followUps.map(lead => (
                    <div 
                      key={lead.id} 
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/leads');
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 p-1.5 bg-red-50 text-red-500 rounded-lg">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Follow up with {lead.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{lead.company}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            Due: {formatDate(lead.next_followup_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No new notifications</p>
                  <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => { setIsOpen(false); router.push('/leads'); }}
                className="w-full text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 py-2"
              >
                View All Leads
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
