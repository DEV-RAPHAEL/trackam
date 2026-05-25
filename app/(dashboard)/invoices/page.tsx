"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/lib/store';
import { Plus, CheckCircle, Clock, Trash2, X, FileText, AlertCircle, Eye, Settings, Palette, Send, Bell, MailCheck, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { InvoiceStatus, InvoiceItem, InvoiceTemplate } from '@/types';
import { InvoiceViewModal } from '@/components/invoices/InvoiceViewModal';
import { InvoicePreview } from '@/components/invoices/InvoicePreview';
import { useSearchParams } from 'next/navigation';

function InvoicesPageContent() {
  const { invoices, clients, invoiceTemplates, addInvoice, updateInvoice, deleteInvoice, invoiceDraft, setInvoiceDraft, currentUser, authFetch } = useStore();
  const currentCompany = useStore(state => state.currentCompany);
  const searchParams = useSearchParams();
  const activeType = searchParams.get('type') || 'all';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  
  // Action loading states
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [sendingFollowUpId, setSendingFollowUpId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  
  const [newInvoice, setNewInvoice] = useState({
    client_id: '',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    template_id: invoiceTemplates[0]?.id || 'tpl-classic',
    notes: '',
    send_immediately: false,
    is_recurring: false,
    items: [{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
    type: 'standard', // 'standard' or 'retainer'
    bank_name: '',
    account_name: '',
    account_number: '',
  });

  useEffect(() => {
    if (invoiceDraft) {
      setNewInvoice(prev => ({
        ...prev,
        ...invoiceDraft
      }));
      setIsModalOpen(true);
      setInvoiceDraft(null);
    }
  }, [invoiceDraft, setInvoiceDraft]);

  useEffect(() => {
    if (currentCompany) {
      setNewInvoice(prev => ({
        ...prev,
        bank_name: prev.bank_name || currentCompany.bank_name || '',
        account_name: prev.account_name || currentCompany.account_name || '',
        account_number: prev.account_number || currentCompany.account_number || '',
      }));
    }
  }, [currentCompany]);

  // Sync new invoice type with active filter on modal open
  useEffect(() => {
    if (isModalOpen) {
      setNewInvoice(prev => ({
        ...prev,
        type: activeType === 'retainer' ? 'retainer' : 'standard',
        is_recurring: activeType === 'retainer',
      }));
    }
  }, [isModalOpen, activeType]);

  const totalAmount = newInvoice.items.reduce((sum, item) => sum + item.amount, 0);

  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const handleRemoveItem = (id: string) => {
    if (newInvoice.items.length === 1) return;
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter(item => item.id !== id)
    });
  };

  const handleUpdateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          updated.amount = (updated.quantity || 0) * (updated.rate || 0);
          return updated;
        }
        return item;
      })
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.client_id) return;
    
    addInvoice({
      company_id: currentCompany?.id || '',
      client_id: newInvoice.client_id,
      amount: totalAmount,
      due_date: new Date(newInvoice.due_date).toISOString(),
      status: 'unpaid' as InvoiceStatus,
      items: newInvoice.items,
      template_id: newInvoice.template_id,
      notes: newInvoice.notes,
      is_sent: newInvoice.send_immediately,
      last_sent_at: newInvoice.send_immediately ? new Date().toISOString() : undefined,
      type: newInvoice.type,
      bank_name: newInvoice.bank_name,
      account_name: newInvoice.account_name,
      account_number: newInvoice.account_number,
    });
    
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowPreview(false);
    setNewInvoice({
      client_id: '',
      due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      template_id: (invoiceTemplates || [])[0]?.id || 'tpl-classic',
      notes: '',
      send_immediately: false,
      is_recurring: activeType === 'retainer',
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }],
      type: activeType === 'retainer' ? 'retainer' : 'standard',
      bank_name: currentCompany?.bank_name || '',
      account_name: currentCompany?.account_name || '',
      account_number: currentCompany?.account_number || '',
    });
  };

  const { sendInvoice, sendFollowUp } = useStore();

  const handleSendInvoice = async (id: string) => {
    setSendingInvoiceId(id);
    await sendInvoice(id);
    setSendingInvoiceId(null);
  };

  const handleSendFollowUp = async (id: string) => {
    setSendingFollowUpId(id);
    await sendFollowUp(id);
    setSendingFollowUpId(null);
  };

  const handleMarkPaid = async (id: string) => {
    setMarkingPaidId(id);
    await updateInvoice(id, { status: 'paid' });
    setMarkingPaidId(null);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      setDeletingInvoiceId(id);
      await deleteInvoice(id);
      setDeletingInvoiceId(null);
    }
  };

  const displayedInvoices = (invoices || []).filter(i => {
    if (activeType === 'retainer') {
      return i.type === 'retainer';
    }
    return true; // Show all invoices by default
  });

  const totalUnpaid = displayedInvoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0);
  const totalPaid   = displayedInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  const selectedClient = (clients || []).find(c => c.id === newInvoice.client_id);
  const selectedTemplate = (invoiceTemplates || []).find(t => t.id === newInvoice.template_id) || (invoiceTemplates || [])[0];

  return (
    <div className="space-y-6">
      {currentUser?.role === 'owner' && (!currentCompany?.bank_name || !currentCompany?.account_name || !currentCompany?.account_number) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Company Payment Details Not Configured</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-0.5">Your Naira bank account details have not been set. Clients will not see payment instructions on invoice templates.</p>
            </div>
          </div>
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm shrink-0"
          >
            Set Account Details Now
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {activeType === 'retainer' ? 'Retainer Invoices' : 'Invoices'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {activeType === 'retainer' ? 'Track and manage retainer agreements.' : 'Track billing and collect payments.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d0d1a] rounded-xl border border-slate-200 dark:border-white/5 p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-500"><AlertCircle className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Outstanding</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalUnpaid)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0d0d1a] rounded-xl border border-slate-200 dark:border-white/5 p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"><CheckCircle className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Collected</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0d0d1a] rounded-xl border border-slate-200 dark:border-white/5 p-5 flex items-center gap-4 text-slate-400 dark:text-slate-500">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5"><Palette className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Templates</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{(invoiceTemplates || []).length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0d0d1a] rounded-xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-3">Invoice / Client</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#0d0d1a] text-sm divide-y divide-slate-50 dark:divide-white/5">
              {displayedInvoices.map((invoice) => {
                const client = (clients || []).find(c => c.id === invoice.client_id);
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          invoice.is_sent 
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400" 
                            : "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500"
                        )}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            INV-{invoice.id.substring(0, 6).toUpperCase()}
                            {invoice.is_sent && <MailCheck className="h-3 w-3 text-emerald-500 dark:text-emerald-400" title="Sent to client" />}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{client?.name || 'Unknown Client'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide w-fit",
                            invoice.status === 'paid' 
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" 
                              : "bg-orange-50 dark:bg-orange-950/20 text-orange-500"
                          )}>
                            {invoice.status === 'paid' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {invoice.status}
                          </span>
                          {invoice.type === 'retainer' && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/10">
                              Retainer
                            </span>
                          )}
                        </div>
                        {invoice.last_sent_at && (
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Last sent: {formatDate(invoice.last_sent_at)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">{formatDate(invoice.due_date)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setViewingInvoiceId(invoice.id)}
                          className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                          title="View & Print"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {!invoice.is_sent ? (
                          <button 
                            disabled={sendingInvoiceId === invoice.id}
                            onClick={() => handleSendInvoice(invoice.id)}
                            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send to client"
                          >
                            {sendingInvoiceId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </button>
                        ) : invoice.status === 'unpaid' && (
                          <button 
                            disabled={sendingFollowUpId === invoice.id}
                            onClick={() => handleSendFollowUp(invoice.id)}
                            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send payment reminder"
                          >
                            {sendingFollowUpId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        {invoice.status === 'unpaid' && (
                          <button 
                            disabled={markingPaidId === invoice.id}
                            onClick={() => handleMarkPaid(invoice.id)} 
                            className="ml-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          >
                            {markingPaidId === invoice.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Marking...</span>
                              </>
                            ) : (
                              <span>Mark Paid</span>
                            )}
                          </button>
                        )}
                        <button 
                          disabled={deletingInvoiceId === invoice.id}
                          onClick={() => handleDeleteInvoice(invoice.id)} 
                          className="ml-2 p-2 rounded-lg text-slate-350 dark:text-slate-650 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete invoice"
                        >
                          {deletingInvoiceId === invoice.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          <div className={cn(
            "relative bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
            showPreview ? "w-full max-w-6xl h-[90vh]" : "w-full max-w-3xl max-h-[90vh]"
          )}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg"><FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Create New Invoice</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    showPreview ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 dark:bg-white/5 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? "Edit Mode" : "Preview Template"}
                </button>
                <button onClick={closeModal} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Form Side */}
              <div className={cn(
                "flex-1 overflow-y-auto px-6 py-6 transition-all duration-300",
                showPreview ? "border-r border-slate-100 dark:border-white/5" : ""
              )}>
                <form onSubmit={handleAdd} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Client</label>
                      <select
                        required
                        value={newInvoice.client_id}
                        onChange={e => setNewInvoice({ ...newInvoice, client_id: e.target.value })}
                        className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      >
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-300">Select a client…</option>
                        {(clients || []).map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{c.name} — {c.company}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
                      <input
                        required
                        type="date"
                        value={newInvoice.due_date}
                        onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                        className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Template Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(invoiceTemplates || []).map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setNewInvoice({...newInvoice, template_id: tpl.id})}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-xl border transition-all text-left",
                            newInvoice.template_id === tpl.id 
                              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm" 
                              : "border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-slate-200 dark:hover:border-white/10"
                          )}
                        >
                          <div className="w-full h-8 rounded mb-2 bg-slate-200 dark:bg-slate-800 overflow-hidden flex flex-col gap-1 p-1">
                             <div className="h-1 w-1/2 bg-slate-400 rounded-full" style={newInvoice.template_id === tpl.id ? {backgroundColor: tpl.accent_color} : {}} />
                             <div className="h-1 w-full bg-slate-300 dark:bg-slate-700 rounded-full" />
                             <div className="h-1 w-full bg-slate-300 dark:bg-slate-700 rounded-full" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{tpl.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Line Items</label>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 uppercase tracking-widest"
                      >
                        + Add Item
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {newInvoice.items.map((item, idx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-end group">
                          <div className="col-span-6">
                            <input
                              required
                              placeholder="Description"
                              value={item.description}
                              onChange={e => handleUpdateItem(item.id, { description: e.target.value })}
                              className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              required
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={e => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                              className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              required
                              type="number"
                              placeholder="Rate"
                              value={item.rate || ''}
                              onChange={e => handleUpdateItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                              className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center pb-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-300 dark:text-slate-650 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invoice Type Selection (Retainers Tracking) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewInvoice({ ...newInvoice, type: 'standard' })}
                        className={cn(
                          "py-2 px-3 text-sm font-semibold rounded-lg border text-center transition-all",
                          newInvoice.type === 'standard'
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                            : "border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-400 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                      >
                        Standard Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewInvoice({ ...newInvoice, type: 'retainer' })}
                        className={cn(
                          "py-2 px-3 text-sm font-semibold rounded-lg border text-center transition-all",
                          newInvoice.type === 'retainer'
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-400 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                      >
                        Retainer Invoice
                      </button>
                    </div>
                  </div>

                  {/* Direct Bank Transfer Details Section */}
                  <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl space-y-3">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Printed Bank Account Details</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={newInvoice.bank_name}
                          onChange={e => setNewInvoice({ ...newInvoice, bank_name: e.target.value })}
                          placeholder="e.g. Zenith Bank"
                          className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Account Name</label>
                        <input
                          type="text"
                          value={newInvoice.account_name}
                          onChange={e => setNewInvoice({ ...newInvoice, account_name: e.target.value })}
                          placeholder="Acme Ltd"
                          className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                        <input
                          type="text"
                          value={newInvoice.account_number}
                          onChange={e => setNewInvoice({ ...newInvoice, account_number: e.target.value })}
                          placeholder="1012345678"
                          className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={newInvoice.notes}
                      onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                      placeholder="Thank you for your business..."
                      className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none placeholder-slate-400 dark:placeholder-slate-650"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                    <input
                      type="checkbox"
                      id="send_immediately"
                      checked={newInvoice.send_immediately}
                      onChange={e => setNewInvoice({ ...newInvoice, send_immediately: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="send_immediately" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer select-none">
                      Send to client automatically via email on creation
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl mt-3">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={newInvoice.is_recurring}
                      onChange={e => setNewInvoice({ ...newInvoice, is_recurring: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="is_recurring" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer select-none">
                      Monthly Retainer (Auto-generate every month)
                    </label>
                  </div>

                </form>
              </div>

              {/* Preview Side */}
              {showPreview && (
                <div className="flex-1 bg-slate-50 dark:bg-black/20 overflow-hidden flex flex-col border-l border-slate-100 dark:border-white/5">
                   <div className="p-4 bg-white dark:bg-[#0d0d1a] border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Live Template Preview</span>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{backgroundColor: selectedTemplate?.accent_color}} />
                         <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{selectedTemplate?.name}</span>
                      </div>
                   </div>
                   <div className="flex-1 overflow-auto p-8">
                      <div className="max-w-[700px] mx-auto shadow-2xl rounded-sm">
                        <InvoicePreview
                          invoice={{ ...newInvoice, amount: totalAmount }}
                          template={selectedTemplate}
                          client={selectedClient}
                          company={currentCompany}
                        />
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Amount</p>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(totalAmount)}</p>
               </div>
               <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d1a] px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newInvoice.client_id || totalAmount === 0}
                  className="rounded-lg bg-emerald-600 px-8 py-2.5 text-sm font-black uppercase tracking-widest text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingInvoiceId && (
        <InvoiceViewModal 
          invoiceId={viewingInvoiceId} 
          onClose={() => setViewingInvoiceId(null)} 
        />
      )}

      {isBankModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(9, 9, 15, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsBankModalOpen(false); }}
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Configure Payment Details</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Set up bank details once and for all</p>
                </div>
              </div>
              <button onClick={() => setIsBankModalOpen(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formTarget = e.currentTarget;
              const fd = new FormData(formTarget);
              const bank_name = fd.get('bank_name') as string;
              const account_name = fd.get('account_name') as string;
              const account_number = fd.get('account_number') as string;
              
              try {
                const res = await authFetch(`/api/companies/${currentCompany?.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ bank_name, account_name, account_number })
                });
                if (res.ok) {
                  useStore.getState().updateCompanyBranding({ bank_name, account_name, account_number });
                  useStore.getState().addToast('Payment details configured successfully ✓', 'success');
                  setIsBankModalOpen(false);
                } else {
                  const data = await res.json();
                  useStore.getState().addToast(data.error || 'Failed to save details', 'error');
                }
              } catch {
                useStore.getState().addToast('An unexpected error occurred', 'error');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bank Name</label>
                <input required name="bank_name" type="text" defaultValue={currentCompany?.bank_name || ''} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" placeholder="e.g. Zenith Bank" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Account Name</label>
                <input required name="account_name" type="text" defaultValue={currentCompany?.account_name || ''} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" placeholder="e.g. Acme Tech Solutions" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Account Number</label>
                <input required name="account_number" type="text" defaultValue={currentCompany?.account_number || ''} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" placeholder="e.g. 1012345678" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-sm">Save Bank Details</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <InvoicesPageContent />
    </Suspense>
  );
}
