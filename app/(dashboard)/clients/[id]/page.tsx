"use client";

import React, { use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, getInvoiceEffectiveStatus } from '@/lib/utils';
import { ArrowLeft, Mail, Phone, Building, Briefcase, FileText, TrendingUp, CheckSquare, Clock, Edit3, X } from 'lucide-react';

export default function ClientProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { clients, deals, invoices, tasks } = useStore();

  const client = (clients || []).find(c => c.id === id);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const { updateClient } = useStore();
  const [editForm, setEditForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active' as 'active' | 'inactive',
  });

  React.useEffect(() => {
    if (client) {
      setEditForm({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        company: client.company || '',
        status: client.status,
      });
    }
  }, [client]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClient(id, editForm);
    setIsEditModalOpen(false);
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-slate-500 dark:text-slate-400">Client not found.</p>
        <button onClick={() => router.push('/clients')} className="text-emerald-600 dark:text-emerald-400 hover:underline">Go back</button>
      </div>
    );
  }

  const clientDeals = (deals || []).filter(d => d.client_id === id);
  const activeDeals = clientDeals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
  
  const clientInvoices = (invoices || []).filter(i => i.client_id === id);
  const ltv = clientInvoices.filter(i => getInvoiceEffectiveStatus(i) === 'paid').reduce((s, i) => s + i.amount, 0);
  const unpaid = clientInvoices.filter(i => getInvoiceEffectiveStatus(i) === 'unpaid').reduce((s, i) => s + i.amount, 0);

  // Filter tasks using the precise client_id, and fallback to title matching for legacy tasks
  const clientTasks = (tasks || []).filter(t => 
    t.client_id === id ||
    t.title.toLowerCase().includes(client.name.toLowerCase()) || 
    (client.company && t.title.toLowerCase().includes(client.company.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/clients')} className="p-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              {client.name}
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest ${client.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{client.status}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building className="h-4 w-4" /> {client.company || 'Independent'}
            </p>
          </div>
        </div>
        <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
          <Edit3 className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Profile & Contact */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border-4 border-white dark:border-[#0d0d1a] shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-3xl">
                {client.name.charAt(0)}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                <Mail className="h-5 w-5 text-emerald-400" />
                <span className="font-medium">{client.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                <Phone className="h-5 w-5 text-emerald-400" />
                <span className="font-medium">{client.phone || 'No phone'}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">Added on {formatDate(client.created_at)}</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Financial Health
            </h3>
            
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Lifetime Value</p>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200">{formatCurrency(ltv)}</p>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Outstanding Balance</p>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200">{formatCurrency(unpaid)}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Pipeline */}
          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" /> Active Deals
              </h3>
              <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded-lg">{activeDeals.length} Open</span>
            </div>
            <div className="p-5">
              {activeDeals.length > 0 ? (
                <div className="space-y-3">
                  {activeDeals.map(deal => (
                    <div key={deal.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{deal.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Updated {formatDate(deal.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(deal.value)}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {deal.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">No active deals in the pipeline.</p>
              )}
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" /> Invoice History
              </h3>
            </div>
            <div className="p-0">
              {clientInvoices.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                    <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-right">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-900 dark:text-slate-200">
                    {[...(clientInvoices || [])].sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).map((inv) => {
                      const effStatus = getInvoiceEffectiveStatus(inv);
                      return (
                        <tr key={inv.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5">
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${effStatus === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'}`}>
                              {effStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-slate-700 dark:text-slate-300">{formatCurrency(inv.amount)}</td>
                          <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-400">{formatDate(inv.due_date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic py-8 text-center">No invoices issued yet.</p>
              )}
            </div>
          </div>

          {/* Related Tasks */}
          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
             <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-orange-500" /> Related Tasks
              </h3>
            </div>
            <div className="p-5">
              {clientTasks.length > 0 ? (
                <div className="space-y-3">
                  {clientTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-700'}`}></div>
                      <div>
                        <p className={`text-sm font-bold ${task.status === 'done' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">No tasks related to this client.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/5">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Edit Client</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Company</label>
                <input type="text" value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as any})} className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Active</option>
                  <option value="inactive" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Inactive</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
