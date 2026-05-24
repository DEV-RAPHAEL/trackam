"use client";

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Trash2, X, Users, Briefcase, FileText, TrendingUp, Mail, Phone, Building } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { BulkImportModal } from '@/components/BulkImportModal';

export default function ClientsPage() {
  const { clients, addClient, deleteClient, currentUser } = useStore();
  const currentCompany = useStore(state => state.currentCompany);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const router = useRouter();
  
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  const filteredClients = (clients || []).filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;
    addClient({
      company_id: currentCompany.id,
      ...newClient,
      status: 'active',
    });
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewClient({ name: '', email: '', phone: '', company: '' });
  };

  const handleBulkImport = (data: any[]) => {
    if (!currentCompany) return;
    data.forEach(client => {
      addClient({
        company_id: currentCompany.id,
        name: client.name || 'Unknown',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        status: 'active',
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your customer database.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 text-sm font-bold tracking-wide text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            Import CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-emerald-400 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Client
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0d0d1a] rounded-xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/5">
          <div className="relative rounded-lg shadow-sm max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white pl-10 focus:border-emerald-500 focus:ring-emerald-500/20 sm:text-sm py-1.5 border transition-all"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Contact</th>
                <th scope="col" className="px-6 py-3">Company</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Added</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#0d0d1a] text-sm text-slate-900 dark:text-slate-200">
              {filteredClients.map((client) => (
                <tr key={client.id} onClick={() => router.push(`/clients/${client.id}`)} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{client.name}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-slate-900 dark:text-slate-200">{client.email}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{client.phone}</div>
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                    {client.company}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 text-[10px] font-bold text-emerald-500 dark:text-emerald-400 tracking-wide uppercase">
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400 text-xs">
                    <div className="flex items-center justify-end gap-3">
                      {formatDate(client.created_at)}
                      {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
                        <button onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 focus:outline-none transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Add Client</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Fill in the client details</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input required type="text" autoFocus value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input required type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                <input type="text" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" placeholder="555-0100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Company</label>
                <input type="text" value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" placeholder="Acme Corp" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-sm">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
        type="clients"
      />
    </div>
  );
}
