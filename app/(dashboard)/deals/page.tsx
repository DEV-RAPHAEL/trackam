"use client";

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Plus, Trash2, X, TrendingUp } from 'lucide-react';
import { DealStage } from '@/types';
import { useRouter } from 'next/navigation';

const stages: { id: DealStage; name: string; color: string }[] = [
  { id: 'Prospect', name: 'Prospect', color: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200' },
  { id: 'Negotiation', name: 'Negotiation', color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300' },
  { id: 'Won', name: 'Won', color: 'bg-green-100 dark:bg-emerald-950/40 text-green-800 dark:text-emerald-300' },
  { id: 'Lost', name: 'Lost', color: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300' },
];

export default function DealsPage() {
  const { deals, clients, leads, addDeal, updateDeal, deleteDeal, setInvoiceDraft, addTask, team, currentUser } = useStore();
  const currentCompany = useStore(state => state.currentCompany);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [newDeal, setNewDeal] = useState({
    title: '',
    client_id: '',
    lead_id: '',
    value: 0,
    stage: 'Prospect' as DealStage
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.client_id || !currentCompany) return;
    addDeal({
      company_id: currentCompany.id,
      ...newDeal,
    });
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewDeal({ title: '', client_id: '', lead_id: '', value: 0, stage: 'Prospect' });
  };

  const moveToStage = (dealId: string, newStage: DealStage) => {
    updateDeal(dealId, { stage: newStage });
    
    if (newStage === 'Negotiation') {
      const deal = (deals || []).find(d => d.id === dealId);
      const adminUser = (team || []).find(u => u.role === 'admin') || (team || [])[0];
      if (deal && adminUser && currentCompany) {
        addTask({
          company_id: currentCompany.id,
          assigned_to: adminUser.id,
          title: `Draft final proposal for: ${deal.title}`,
          description: `Auto-generated task: Client negotiation started.`,
          status: 'todo',
          priority: 'high',
          due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          progress: 0,
        });
      }
    }

    if (newStage === 'Won') {
      const deal = (deals || []).find(d => d.id === dealId);
      if (deal) {
        setInvoiceDraft({
          client_id: deal.client_id,
          amount: deal.value,
          items: [{ 
            id: crypto.randomUUID(), 
            description: `Services rendered for: ${deal.title}`, 
            quantity: 1, 
            rate: deal.value, 
            amount: deal.value 
          }]
        });
        router.push('/invoices');
      }
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Deals (Pipeline)</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage your sales pipeline.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-emerald-400 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Add Deal
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 min-w-max pb-4 h-full">
          {stages.map((stage) => {
            const stageDeals = (deals || []).filter(d => d.stage === stage.id);
            const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div key={stage.id} className="w-80 flex flex-col pt-2 shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{stage.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{formatCurrency(totalValue)}</span>
                    <span className="bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 py-0.5 px-2 rounded-full text-[10px] font-bold">
                      {stageDeals.length}
                    </span>
                  </div>
                </div>
                
                <div 
                  className={cn(
                    "rounded-xl p-3 flex-1 overflow-y-auto border-2 border-dashed space-y-3 min-h-[200px] transition-colors",
                    dragOverStage === stage.id 
                      ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20" 
                      : "border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/5"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverStage(null);
                    const dealId = e.dataTransfer.getData('dealId');
                    if (dealId) moveToStage(dealId, stage.id);
                  }}
                >
                  {stageDeals.map(deal => {
                    const client = (clients || []).find(c => c.id === deal.client_id);
                    return (
                      <div 
                        key={deal.id} 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('dealId', deal.id);
                          setDraggedDealId(deal.id);
                        }}
                        onDragEnd={() => setDraggedDealId(null)}
                        className={cn(
                          "group bg-white dark:bg-[#0f0f1c] p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing transition-all",
                          draggedDealId === deal.id 
                            ? "opacity-50 border-emerald-400 scale-95" 
                            : "border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-white line-clamp-1 pr-2" title={deal.title}>{deal.title}</h4>
                          {currentUser?.role !== 'user' && (
                            <button onClick={() => deleteDeal(deal.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors focus:outline-none">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{client?.name || 'Unknown Client'}</p>
                        {deal.lead_id && (
                          <div className="flex items-center gap-1 mb-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">VIA</span>
                            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase">Lead: {(leads || []).find(l => l.id === deal.lead_id)?.name}</span>
                          </div>
                        )}
                        {!deal.lead_id && <div className="mb-3"></div>}
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(deal.value)}</span>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase', stage.color)}>
                            {stage.name}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(9, 9, 15, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Create Deal</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Add a new deal to the pipeline</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deal Title</label>
                <input required type="text" autoFocus value={newDeal.title} onChange={e => setNewDeal({...newDeal, title: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" placeholder="e.g. Website Redesign" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Client</label>
                <select required value={newDeal.client_id} onChange={e => setNewDeal({...newDeal, client_id: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-300">Select a client…</option>
                  {(clients || []).map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{c.name} — {c.company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Source Lead (Optional)</label>
                <select value={newDeal.lead_id} onChange={e => setNewDeal({...newDeal, lead_id: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-300">Select a lead…</option>
                  {(leads || []).filter(l => l.stage !== 'Converted' && l.stage !== 'Lost').map(l => (
                    <option key={l.id} value={l.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{l.name} — {l.company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium">₦</span>
                  <input required type="number" min="0" step="1" value={newDeal.value || ''} onChange={e => setNewDeal({...newDeal, value: parseFloat(e.target.value) || 0})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Stage</label>
                <select required value={newDeal.stage} onChange={e => setNewDeal({...newDeal, stage: e.target.value as DealStage})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
                  {stages.map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{s.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-sm">Create Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
