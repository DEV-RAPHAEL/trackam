"use client";

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { getInvoiceEffectiveStatus, formatCurrency, formatDate } from '@/lib/utils';
import { 
  FileText, TrendingUp, Download, BarChart3, Briefcase, Users, Target, CheckSquare, Calendar, Loader2, Sparkles, AlertCircle 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ReportsPage() {
  const { invoices, clients, leads, deals, tasks, currentUser, currentCompany } = useStore();
  const [reportType, setReportType] = useState<'financial' | 'crm' | 'operations'>('financial');
  const [dateRange, setDateRange] = useState<'30days' | 'year' | 'all'>('all');
  
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Date filtering helper
  const filterByDateRange = (dateStr: string | undefined | null) => {
    if (!dateStr) return false;
    if (dateRange === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (dateRange === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return date >= thirtyDaysAgo;
    }
    if (dateRange === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return date >= startOfYear;
    }
    return true;
  };

  // Apply filters
  const filteredInvoices = (invoices || []).filter(i => filterByDateRange(i.created_at));
  const filteredClients = (clients || []).filter(c => filterByDateRange(c.created_at));
  const filteredLeads = (leads || []).filter(l => filterByDateRange(l.created_at));
  const filteredDeals = (deals || []).filter(d => filterByDateRange(d.created_at));
  const filteredTasks = (tasks || []).filter(t => filterByDateRange(t.created_at));

  // Compute Metrics
  const totalRevenue = filteredInvoices
    .filter(i => getInvoiceEffectiveStatus(i) === 'paid')
    .reduce((s, i) => s + i.amount, 0);

  const pendingRevenue = filteredInvoices
    .filter(i => getInvoiceEffectiveStatus(i) === 'unpaid')
    .reduce((s, i) => s + i.amount, 0);

  const totalDealsValue = filteredDeals.reduce((s, d) => s + d.value, 0);
  const wonDealsValue = filteredDeals.filter(d => d.stage === 'Won').reduce((s, d) => s + d.value, 0);
  const winRate = filteredDeals.length > 0 
    ? Math.round((filteredDeals.filter(d => d.stage === 'Won').length / filteredDeals.length) * 100) 
    : 0;

  const completedTasks = filteredTasks.filter(t => t.status === 'done').length;
  const taskCompletionRate = filteredTasks.length > 0 
    ? Math.round((completedTasks / filteredTasks.length) * 100) 
    : 0;

  // Chart Data Preparation
  // 1. Financial Chart Data (Revenue trends)
  const financialHistoryMap = new Map();
  filteredInvoices.forEach(inv => {
    const month = inv.created_at.substring(0, 7);
    const effStatus = getInvoiceEffectiveStatus(inv);
    const current = financialHistoryMap.get(month) || { collected: 0, outstanding: 0 };
    if (effStatus === 'paid') {
      current.collected += inv.amount;
    } else {
      current.outstanding += inv.amount;
    }
    financialHistoryMap.set(month, current);
  });

  const financialChartData = Array.from(financialHistoryMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, data]) => ({
      name: month,
      Collected: data.collected,
      Outstanding: data.outstanding
    }));

  // 2. Sales Chart Data (Lead Stage distribution)
  const leadStages = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
  const crmChartData = leadStages.map(stage => ({
    name: stage,
    Leads: filteredLeads.filter(l => l.stage === stage).length
  }));

  // 3. Operations Chart Data (Task Status distribution)
  const taskStatuses = ['todo', 'in_progress', 'review', 'done'];
  const operationsChartData = taskStatuses.map(status => ({
    name: status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : status === 'review' ? 'In Review' : 'Done',
    value: filteredTasks.filter(t => t.status === status).length
  })).filter(t => t.value > 0);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  // Trigger download actions calling the API
  const handleExport = async (format: 'pdf' | 'csv') => {
    const setLoader = format === 'pdf' ? setIsExportingPdf : setIsExportingCsv;
    setLoader(true);
    try {
      const response = await fetch(`/api/reports?type=${reportType}&dateRange=${dateRange}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('trackam_token')}`
        }
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Trackam-${reportType}-report-${dateRange}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error(e);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-emerald-500/30">
              <Sparkles className="w-3 h-3" /> Strategic Insights
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Reports Control Center
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Analyze financials, CRM pipelines, and operations with branded strategic exports.
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex flex-wrap gap-3">
            <button 
              disabled={isExportingCsv}
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingCsv ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-slate-400" />
              )}
              Export CSV Data
            </button>
            
            <button 
              disabled={isExportingPdf}
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileText className="w-4 h-4 text-emerald-100" />
              )}
              Download PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Tab Select Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
        {/* Report Types Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-full sm:w-auto">
          {(['financial', 'crm', 'operations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setReportType(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                reportType === tab 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {tab === 'financial' ? 'Finances & Billing' : tab === 'crm' ? 'Sales & Pipelines' : 'Operations & Tasks'}
            </button>
          ))}
        </div>

        {/* Date Filter Select */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="30days" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Last 30 Days</option>
            <option value="year" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Year to Date</option>
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">All Time</option>
          </select>
        </div>
      </div>

      {/* Dynamic Summary metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportType === 'financial' && (
          <>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue Collected</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(pendingRevenue)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><FileText className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoices Issued</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filteredInvoices.length} invoices</p>
              </div>
            </div>
          </>
        )}

        {reportType === 'crm' && (
          <>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><Briefcase className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pipeline Valuation</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(totalDealsValue)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><Sparkles className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Won Pipeline Value</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(wonDealsValue)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl"><Target className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sales Win Rate</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{winRate}% conversion</p>
              </div>
            </div>
          </>
        )}

        {reportType === 'operations' && (
          <>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl"><CheckSquare className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operational Tasks</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filteredTasks.length} total tasks</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task Completion Rate</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{taskCompletionRate}% done</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Workspace Leads</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filteredLeads.length} leads</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visual Analytics graphs card */}
      <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm overflow-hidden">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
          <BarChart3 className="w-4 h-4 text-emerald-500" /> Branded Visualizations
        </h3>

        <div className="h-[280px]">
          {reportType === 'financial' && (
            financialChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialChartData}>
                  <defs>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutstanding" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '8px', 
                      border: 'none', 
                      color: '#fff',
                      fontSize: '11px' 
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
                  <Area type="monotone" dataKey="Outstanding" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorOutstanding)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">No financial trends data available for this range.</div>
            )
          )}

          {reportType === 'crm' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crmChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '8px', 
                    border: 'none', 
                    color: '#fff',
                    fontSize: '11px'
                  }} 
                />
                <Bar dataKey="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {reportType === 'operations' && (
            operationsChartData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-full">
                <div className="w-[180px] h-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={operationsChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {operationsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                  {operationsChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{entry.name}:</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{entry.value} tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">No task status distribution logs for this range.</div>
            )
          )}
        </div>
      </div>

      {/* Detailed logs table layout */}
      <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            {reportType === 'financial' ? 'Branded Invoice Records Log' :
             reportType === 'crm' ? 'Pipeline Deals Log' : 'Operational Tasks Audit Log'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'financial' && (
            filteredInvoices.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                  <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-800 dark:text-slate-200">
                  {filteredInvoices.slice(0, 10).map(inv => {
                    const client = (clients || []).find(c => c.id === inv.client_id);
                    const effStatus = getInvoiceEffectiveStatus(inv);
                    return (
                      <tr key={inv.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 font-bold uppercase text-emerald-600 dark:text-emerald-450">#{inv.id.substring(0,8)}</td>
                        <td className="px-6 py-4 font-medium">{client?.name || 'Unknown Client'}</td>
                        <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-black uppercase">{inv.type || 'standard'}</span></td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-450">{formatDate(inv.due_date)}</td>
                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(inv.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                            effStatus === 'paid' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                          }`}>
                            {effStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center italic py-8 text-sm">No invoices found for this range.</p>
            )
          )}

          {reportType === 'crm' && (
            filteredDeals.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                  <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Deal Title</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4 text-right">Valuation</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-800 dark:text-slate-200">
                  {filteredDeals.slice(0, 10).map(deal => {
                    const client = (clients || []).find(c => c.id === deal.client_id);
                    return (
                      <tr key={deal.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 font-bold">{deal.title}</td>
                        <td className="px-6 py-4 font-medium">{client?.name || 'Unknown Client'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                            deal.stage === 'Won' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                            deal.stage === 'Lost' ? 'bg-red-50 dark:bg-red-950/20 text-red-650' : 'bg-blue-50 dark:bg-blue-950/20 text-blue-500'
                          }`}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(deal.value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center italic py-8 text-sm">No deals conversions found for this range.</p>
            )
          )}

          {reportType === 'operations' && (
            filteredTasks.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                  <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Task Description</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4 text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-800 dark:text-slate-200">
                  {filteredTasks.slice(0, 10).map(task => (
                    <tr key={task.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5">
                      <td className="px-6 py-4 font-bold">{task.title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                          task.status === 'done' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium uppercase text-[10px]">
                        <span className={
                          task.priority === 'high' || task.priority === 'urgent' ? 'text-red-500 font-bold' : 'text-slate-550'
                        }>
                          {task.priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-500 dark:text-slate-450">{formatDate(task.due_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center italic py-8 text-sm">No task operations logs found for this range.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
