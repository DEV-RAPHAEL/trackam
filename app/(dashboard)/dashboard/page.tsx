"use client";

import React from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, formatDateTime, getInvoiceEffectiveStatus } from '@/lib/utils';
import { Users, Target, Briefcase, CheckSquare, TrendingUp, AlertCircle, RotateCcw, Trophy, Crown, Activity, CreditCard, ShieldCheck, Zap, Settings, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DashboardPage() {
  const { clients, leads, deals, tasks, invoices, activityLogs, analytics, currentCompany, fetchInitialData, currentUser, team, modules } = useStore();
  const router = useRouter();

  const activeDeals = (deals || []).filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
  const pendingTasks = (tasks || []).filter(t => t.status === 'todo' || t.status === 'in_progress');
  const unpaidInvoices = (invoices || []).filter(i => getInvoiceEffectiveStatus(i) === 'unpaid');
  
  const calculatedRevenue = (invoices || []).filter(i => getInvoiceEffectiveStatus(i) === 'paid').reduce((s, i) => s + i.amount, 0);
  const calculatedUnpaid = (invoices || []).filter(i => getInvoiceEffectiveStatus(i) === 'unpaid').reduce((s, i) => s + i.amount, 0);

  const totalLeadsCount = (leads || []).length;
  const totalDealsCount = (deals || []).length;
  const wonDealsCount = (deals || []).filter(d => d.stage === 'Won').length;
  const winRate = totalDealsCount > 0 ? Math.round((wonDealsCount / totalDealsCount) * 100) : 0;

  const stats = [
    { name: 'Revenue', value: formatCurrency(calculatedRevenue), icon: TrendingUp, color: 'text-emerald-600' },
    { name: 'Total Leads', value: totalLeadsCount.toString(), icon: Target, color: 'text-orange-600' },
    { name: 'Win Rate', value: `${winRate}%`, icon: Trophy, color: 'text-purple-600' },
    { name: 'Active Deals', value: activeDeals.length.toString(), icon: Briefcase, color: 'text-blue-600' },
    { name: 'Outstanding', value: formatCurrency(calculatedUnpaid), icon: AlertCircle, color: 'text-amber-600' },
    { name: 'Total Tasks', value: (tasks || []).length.toString(), icon: CheckSquare, color: 'text-emerald-600' },
  ];

  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  const dealDistributionData = ['Prospect', 'Negotiation', 'Won', 'Lost'].map(stage => ({
    name: stage,
    value: (deals || []).filter(d => d.stage === stage).length
  })).filter(d => d.value > 0);

  const historyMap = new Map();
  (invoices || []).filter(i => getInvoiceEffectiveStatus(i) === 'paid').forEach(inv => {
    const month = inv.created_at.substring(0, 7);
    historyMap.set(month, (historyMap.get(month) || 0) + inv.amount);
  });
  
  const revenueHistoryData = Array.from(historyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, total]) => ({ name: month, revenue: total }));

  return (
    <div className="space-y-6">
      {/* 👑 Owner Command Center */}
      {currentUser?.role === 'owner' && (
        <div className="mb-2">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-amber-500/30">
                    <Crown className="w-3 h-3" /> Workspace Owner
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Command Center
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    System overview and administrative controls for {currentCompany?.name}.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={() => router.push('/settings')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm">
                    <Users className="w-4 h-4" /> Manage Team
                  </button>
                  <button onClick={() => router.push('/settings')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/30">
                    <Settings className="w-4 h-4" /> System Settings
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Team Status */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                    <h3 className="font-bold text-white text-sm">Access Control</h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-black text-white">{(team || []).length}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Users</div>
                    </div>
                    <div className="flex -space-x-2">
                      {(team || []).slice(0, 4).map((u, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white" title={u.name}>
                          {u.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* License Status */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><CreditCard className="w-5 h-5" /></div>
                    <h3 className="font-bold text-white text-sm">License Status</h3>
                  </div>
                  <div>
                    <div className="text-lg font-black text-white truncate">{currentCompany?.subscription_status === 'trialing' ? 'Trial Active' : 'Lifetime Core'}</div>
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" /> All systems operational
                    </div>
                  </div>
                </div>

                {/* Modules Status */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><Zap className="w-5 h-5" /></div>
                    <h3 className="font-bold text-white text-sm">System Modules</h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-black text-white">
                        {(modules || []).filter(m => m.status === 'active').length} <span className="text-slate-500 text-lg">/ {(modules || []).length}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unlocked</div>
                    </div>
                    <button onClick={() => router.push('/modules')} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-[#0d0d1a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-slate-50 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{stat.name}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0d0d1a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Revenue Growth</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">6-month trend of paid invoices</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {revenueHistoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueHistoryData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                No revenue history yet. Complete some deals to see data!
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Health */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0d0d1a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">Pipeline Health</h3>
          <div className="h-[300px] w-full">
            {dealDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dealDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dealDistributionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Add deals to see your pipeline.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 👑 Owner Only: Activity Feed */}
      {currentUser?.role === 'owner' && (
        <div className="bg-white dark:bg-[#0d0d1a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Global Audit Trail
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time activity log of all team actions</p>
            </div>
            <button className="text-xs font-bold text-emerald-600 hover:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg transition-colors">
              Export Log
            </button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {(activityLogs || []).slice(0, 15).map((log, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/10">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 font-bold text-xs">
                  {log.user_id ? 'U' : <Activity className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{log.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.description}</p>
                </div>
                <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                  {formatDateTime(log.created_at)}
                </div>
              </div>
            ))}
            {(!activityLogs || activityLogs.length === 0) && (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">No recent activity recorded.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
