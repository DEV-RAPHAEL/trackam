"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Download, Printer, Send, CreditCard } from 'lucide-react';
import { InvoicePreview } from './InvoicePreview';
import { useStore } from '@/lib/store';
import { cn, formatCurrency } from '@/lib/utils';

interface InvoiceViewModalProps {
  invoiceId: string;
  onClose: () => void;
}

export function InvoiceViewModal({ invoiceId, onClose }: InvoiceViewModalProps) {
  const { invoices, clients, currentCompany, invoiceTemplates, addToast } = useStore();
  const invoice = (invoices || []).find(i => i.id === invoiceId);
  const client = (clients || []).find(c => c.id === invoice?.client_id);
  const template = (invoiceTemplates || []).find(t => t.id === invoice?.template_id) || (invoiceTemplates || [])[0];

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${invoiceId.substring(0, 6).toUpperCase()}`,
  });

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg"><Download className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Invoice Viewer</h2>
              <p className="text-[10px] text-slate-500 font-medium">INV-{invoiceId.substring(0, 6).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Preview Area */}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
            <div className="w-full max-w-[800px] shadow-2xl bg-white rounded-sm" ref={componentRef}>
              <InvoicePreview 
                invoice={invoice}
                client={client}
                company={currentCompany}
                template={template}
              />
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="w-72 border-l border-slate-100 p-6 space-y-6 shrink-0 bg-white">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
              <div className={cn(
                "px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2",
                invoice.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
              )}>
                <div className={cn("w-2 h-2 rounded-full", invoice.status === 'paid' ? "bg-emerald-500" : "bg-orange-500")} />
                {invoice.status}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</label>
              <div className="text-2xl font-black text-slate-900">{formatCurrency(invoice.amount)}</div>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={() => useStore.getState().sendInvoice(invoice.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100"
              >
                <Send className="h-4 w-4" />
                Resend to Client
              </button>
              {invoice.status === 'unpaid' && (
                <button 
                  onClick={() => {
                    useStore.getState().updateInvoice(invoice.id, { status: 'paid' });
                    addToast("Invoice marked as paid", "success");
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  Mark as Paid
                </button>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Tip: You can use the "Print / PDF" button to save this invoice as a PDF file or send it directly to your printer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
