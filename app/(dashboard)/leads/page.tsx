"use client";

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatDate, cn } from '@/lib/utils';
import { Plus, Search, Trash2, UserPlus, Briefcase, Eye, X, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LeadStage } from '@/types';
import { BulkImportModal } from '@/components/BulkImportModal';

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead, convertLeadToClient, currentUser } = useStore();
  const router = useRouter();
  const currentCompany = useStore(state => state.currentCompany);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'New' as LeadStage
  });

  const filteredLeads = (leads || []).filter(l => 
    (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;
    addLead({
      company_id: currentCompany.id,
      ...newLead,
    });
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    setNewLead({ name: '', email: '', phone: '', company: '', stage: 'New' });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      updateLead(editingLead.id, editingLead);
    }
    closeModal();
  };

  const handleBulkImport = (data: any[]) => {
    if (!currentCompany) return;
    data.forEach(lead => {
      addLead({
        company_id: currentCompany.id,
        name: lead.name || 'Unknown',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        stage: 'New' as LeadStage,
      });
    });
  };

  const getStageColor = (stage: LeadStage) => {
    switch (stage) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Qualified': return 'bg-purple-100 text-purple-800';
      case 'Converted': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stages: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">Track and convert incoming prospects.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-bold tracking-wide text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Import CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-indigo-400 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative rounded-lg shadow-sm max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border-slate-200 bg-slate-50 pl-10 focus:border-indigo-500 focus:ring-indigo-500/20 sm:text-sm py-1.5 border transition-all"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Company</th>
                <th scope="col" className="px-6 py-3">Stage</th>
                <th scope="col" className="px-6 py-3 text-right">Added</th>
              </tr>
            </thead>
            <tbody className="bg-white text-sm">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                      {lead.name}
                    </Link>
                    <div className="text-xs text-slate-500">{lead.email}</div>
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {lead.company}
                  </td>
                  <td className="px-6 py-3">
                    <select
                      className={cn(
                        "text-[10px] uppercase tracking-wide font-bold rounded-full px-2 py-0.5 outline-none cursor-pointer border-none",
                        getStageColor(lead.stage)
                      )}
                      value={lead.stage}
                      onChange={(e) => updateLead(lead.id, { stage: e.target.value as LeadStage })}
                    >
                      {stages.map((s) => (
                        <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3 text-right text-slate-500 text-xs">
                    <div className="flex items-center justify-end gap-3">
                      {formatDate(lead.created_at)}
                      {lead.stage !== 'Converted' && (
                        <button 
                          onClick={() => {
                            convertLeadToClient(lead.id);
                            router.push('/deals');
                          }} 
                          className="text-indigo-500 hover:text-indigo-700 focus:outline-none transition-colors"
                          title="Convert to Deal"
                        >
                          <Briefcase className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => router.push(`/leads/${lead.id}`)} className="text-slate-400 hover:text-indigo-500 focus:outline-none transition-colors" title="View Lead">
                        <Eye className="w-4 h-4" />
                      </button>
                      {currentUser?.role !== 'user' && (
                        <button onClick={() => deleteLead(lead.id)} className="text-slate-400 hover:text-red-500 focus:outline-none transition-colors" title="Delete Lead">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    No leads found.
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
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Add Lead</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Capture a new prospect</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input required type="text" autoFocus value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input required type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" placeholder="jane@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" placeholder="555-0100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                <input type="text" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" placeholder="Acme Corp" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-sm">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Edit3 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Edit Lead</h2>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input required type="text" value={editingLead.name || ''} onChange={e => setEditingLead({...editingLead, name: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input required type="email" value={editingLead.email || ''} onChange={e => setEditingLead({...editingLead, email: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input type="text" value={editingLead.phone || ''} onChange={e => setEditingLead({...editingLead, phone: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                <input type="text" value={editingLead.company || ''} onChange={e => setEditingLead({...editingLead, company: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Contact Date</label>
                <input type="date" value={editingLead.last_contact_date ? editingLead.last_contact_date.substring(0, 10) : ''} onChange={e => setEditingLead({...editingLead, last_contact_date: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Next Follow-up Date</label>
                <input type="date" value={editingLead.next_followup_date ? editingLead.next_followup_date.substring(0, 10) : ''} onChange={e => setEditingLead({...editingLead, next_followup_date: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea rows={3} value={editingLead.notes || ''} onChange={e => setEditingLead({...editingLead, notes: e.target.value})} className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BulkImportModal

        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
        type="leads"
      />
    </div>
  );
}
