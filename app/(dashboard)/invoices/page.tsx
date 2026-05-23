"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Plus, CheckCircle, Clock, Trash2, X, FileText, AlertCircle, Eye, Settings, Palette, Send, Bell, MailCheck } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { InvoiceStatus, InvoiceItem, InvoiceTemplate } from '@/types';
import { InvoiceViewModal } from '@/components/invoices/InvoiceViewModal';
import { InvoicePreview } from '@/components/invoices/InvoicePreview';

export default function InvoicesPage() {
  const { invoices, clients, invoiceTemplates, addInvoice, updateInvoice, deleteInvoice, invoiceDraft, setInvoiceDraft } = useStore();
  const currentCompany = useStore(state => state.currentCompany);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  
  const [newInvoice, setNewInvoice] = useState({
    client_id: '',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    template_id: invoiceTemplates[0]?.id || 'tpl-classic',
    notes: '',
    send_immediately: false,
    is_recurring: false,
    items: [{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
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
    
    const invoiceId = crypto.randomUUID();
    addInvoice({
      id: invoiceId,
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
      is_recurring: false,
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const markPaid = (id: string) => updateInvoice(id, { status: 'paid' });
  const { sendInvoice, sendFollowUp } = useStore();

  const totalUnpaid = (invoices || []).filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0);
  const totalPaid   = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  const selectedClient = (clients || []).find(c => c.id === newInvoice.client_id);
  const selectedTemplate = (invoiceTemplates || []).find(t => t.id === newInvoice.template_id) || (invoiceTemplates || [])[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Track billing and collect payments.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-orange-50 text-orange-500"><AlertCircle className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Outstanding</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalUnpaid)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-500"><CheckCircle className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Collected</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 text-slate-400">
          <div className="p-3 rounded-lg bg-slate-50"><Palette className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Templates</p>
            <p className="text-xl font-bold text-slate-800">{(invoiceTemplates || []).length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Invoice / Client</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white text-sm divide-y divide-slate-50">
              {(invoices || []).map((invoice) => {
                const client = (clients || []).find(c => c.id === invoice.client_id);
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          invoice.is_sent ? "bg-indigo-50 text-indigo-500" : "bg-slate-50 text-slate-400"
                        )}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            INV-{invoice.id.substring(0, 6).toUpperCase()}
                            {invoice.is_sent && <MailCheck className="h-3 w-3 text-indigo-500" title="Sent to client" />}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{client?.name || 'Unknown Client'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide w-fit",
                          invoice.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-500"
                        )}>
                          {invoice.status === 'paid' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {invoice.status}
                        </span>
                        {invoice.last_sent_at && (
                          <span className="text-[9px] text-slate-400 font-medium">Last sent: {formatDate(invoice.last_sent_at)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{formatDate(invoice.due_date)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setViewingInvoiceId(invoice.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="View & Print"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {!invoice.is_sent ? (
                          <button 
                            onClick={() => sendInvoice(invoice.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Send to client"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        ) : invoice.status === 'unpaid' && (
                          <button 
                            onClick={() => sendFollowUp(invoice.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            title="Send payment reminder"
                          >
                            <Bell className="h-4 w-4" />
                          </button>
                        )}
                        
                        {invoice.status === 'unpaid' && (
                          <button onClick={() => markPaid(invoice.id)} className="ml-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide transition-colors">
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => deleteInvoice(invoice.id)} className="ml-2 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 className="w-4 h-4" />
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className={cn(
            "relative bg-white rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
            showPreview ? "w-full max-w-6xl h-[90vh]" : "w-full max-w-3xl max-h-[90vh]"
          )}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="h-5 w-5 text-indigo-600" /></div>
                <h2 className="text-base font-semibold text-slate-900">Create New Invoice</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    showPreview ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? "Edit Mode" : "Preview Template"}
                </button>
                <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Form Side */}
              <div className={cn(
                "flex-1 overflow-y-auto px-6 py-6 transition-all duration-300",
                showPreview ? "border-r border-slate-100" : ""
              )}>
                <form onSubmit={handleAdd} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Client</label>
                      <select
                        required
                        value={newInvoice.client_id}
                        onChange={e => setNewInvoice({ ...newInvoice, client_id: e.target.value })}
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      >
                        <option value="">Select a client…</option>
                        {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
                      <input
                        required
                        type="date"
                        value={newInvoice.due_date}
                        onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Template Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(invoiceTemplates || []).map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setNewInvoice({...newInvoice, template_id: tpl.id})}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-xl border transition-all text-left",
                            newInvoice.template_id === tpl.id 
                              ? "border-indigo-500 bg-indigo-50/50 shadow-sm" 
                              : "border-slate-100 bg-white hover:border-slate-200"
                          )}
                        >
                          <div className="w-full h-8 rounded mb-2 bg-slate-200 overflow-hidden flex flex-col gap-1 p-1">
                             <div className="h-1 w-1/2 bg-slate-400 rounded-full" style={newInvoice.template_id === tpl.id ? {backgroundColor: tpl.accent_color} : {}} />
                             <div className="h-1 w-full bg-slate-300 rounded-full" />
                             <div className="h-1 w-full bg-slate-300 rounded-full" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">{tpl.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Line Items</label>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
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
                              className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
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
                              className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              required
                              type="number"
                              placeholder="Rate"
                              value={item.rate || ''}
                              onChange={e => handleUpdateItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                              className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center pb-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={newInvoice.notes}
                      onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                      placeholder="Thank you for your business..."
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <input
                      type="checkbox"
                      id="send_immediately"
                      checked={newInvoice.send_immediately}
                      onChange={e => setNewInvoice({ ...newInvoice, send_immediately: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="send_immediately" className="text-xs font-bold text-indigo-700 cursor-pointer select-none">
                      Send to client automatically via email on creation
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 mt-3">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={newInvoice.is_recurring}
                      onChange={e => setNewInvoice({ ...newInvoice, is_recurring: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="is_recurring" className="text-xs font-bold text-emerald-700 cursor-pointer select-none">
                      Monthly Retainer (Auto-generate every month)
                    </label>
                  </div>

                </form>
              </div>

              {/* Preview Side */}
              {showPreview && (
                <div className="flex-1 bg-slate-50 overflow-hidden flex flex-col border-l border-slate-100">
                   <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Template Preview</span>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{backgroundColor: selectedTemplate?.accent_color}} />
                         <span className="text-[10px] font-bold text-slate-600">{selectedTemplate?.name}</span>
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
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                  <p className="text-xl font-black text-slate-800">{formatCurrency(totalAmount)}</p>
               </div>
               <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newInvoice.client_id || totalAmount === 0}
                  className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-black uppercase tracking-widest text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
