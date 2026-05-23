"use client";

import React from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Mail, Phone, Globe, MapPin, Award, Building2 } from 'lucide-react';
import { Invoice, InvoiceTemplate, Client, Company } from '@/types';

interface Props {
  invoice: Partial<Invoice>;
  template: InvoiceTemplate;
  client: Client | undefined;
  company: Company | null;
}

export function InvoicePreview({ invoice, template, client, company }: Props) {
  // Use template accent color or company brand color
  const accentColor = template.accent_color || company?.brand_color || '#4f46e5';
  const style = template.style;

  if (style === 'luxury') {
    return (
      <div className="w-full h-full bg-[#111] text-slate-300 p-10 font-serif overflow-y-auto">
        {/* Luxury Header */}
        <div className="flex flex-col items-center mb-12 border-b border-white/10 pb-10">
          {company?.logo ? (
            <img src={company.logo} alt="Logo" className="h-16 w-auto mb-6 grayscale hover:grayscale-0 transition-all" />
          ) : (
            <div className="p-4 rounded-full border-2 border-white/20 mb-6">
              <Award className="h-10 w-10" style={{ color: accentColor }} />
            </div>
          )}
          <h1 className="text-4xl font-light tracking-[0.3em] uppercase" style={{ color: accentColor }}>
            {template.header_text || 'Premium Invoice'}
          </h1>
          <p className="text-white/40 text-[10px] mt-2 tracking-[0.5em] uppercase">Private & Confidential</p>
        </div>

        <div className="grid grid-cols-2 gap-16 mb-12">
          <div>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Client Detail</p>
            <h3 className="text-lg font-medium text-white mb-2">{client?.name}</h3>
            <p className="text-xs text-white/50 leading-relaxed">{client?.company}</p>
            <p className="text-xs text-white/50">{client?.address || 'Lagos, Nigeria'}</p>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Invoice Reference</p>
            <p className="text-sm font-medium text-white mb-4">#{invoice.id?.substring(0, 8).toUpperCase() || 'PREVIEW'}</p>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Settlement Date</p>
            <p className="text-sm font-medium" style={{ color: accentColor }}>{formatDate(invoice.due_date)}</p>
          </div>
        </div>

        <table className="w-full mb-12">
          <thead className="border-b border-white/10">
            <tr className="text-[10px] text-white/40 uppercase tracking-widest text-left">
              <th className="py-4 font-normal">Service Detail</th>
              <th className="py-4 font-normal text-right">Settlement Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx}>
                <td className="py-6">
                  <p className="text-sm font-medium text-white">{item.description}</p>
                  <p className="text-[10px] text-white/30 mt-1 italic">Quantity: {item.quantity} units @ {formatCurrency(item.rate)}</p>
                </td>
                <td className="py-6 text-right text-sm font-medium text-white">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-white/10 pt-8">
          <div className="w-64">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Total Valuation</span>
              <span className="text-2xl font-light text-white">{formatCurrency(invoice.amount || 0)}</span>
            </div>
            <div className="h-0.5 w-full bg-white/10 relative overflow-hidden">
              <div className="absolute inset-0 h-full w-1/3" style={{ backgroundColor: accentColor }} />
            </div>
          </div>
        </div>

        {((company as any)?.bank_name || (company as any)?.account_name || (company as any)?.account_number) && (
          <div className="mt-8 p-4 border border-white/10 rounded-lg">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Payment Details</p>
            <div className="grid grid-cols-3 gap-4">
              {((company as any)?.bank_name) && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Bank Name</p>
                  <p className="text-sm text-white font-medium">{(company as any)?.bank_name}</p>
                </div>
              )}
              {((company as any)?.account_name) && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Account Name</p>
                  <p className="text-sm text-white font-medium">{(company as any)?.account_name}</p>
                </div>
              )}
              {((company as any)?.account_number) && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Account Number</p>
                  <p className="text-sm text-white font-medium">{(company as any)?.account_number}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/20 italic">{template.footer_text || 'Thank you for choosing Lagos Tech Solutions.'}</p>
        </div>
      </div>
    );
  }

  if (style === 'corporate') {
    return (
      <div className="w-full h-full bg-white p-8 font-sans overflow-y-auto text-slate-800">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
             <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none">{company?.name || 'Your Company'}</h1>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{template.header_text || 'Official Invoice'}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xl font-black italic text-slate-200">ORIGINAL</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-12">
           <div className="col-span-1 bg-slate-50 p-4 rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Recipient</p>
              <h3 className="text-sm font-bold truncate">{client?.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-tight">{client?.company}</p>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                 <Mail className="h-3 w-3" /> {client?.email}
              </p>
           </div>
           <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="border-l-2 border-slate-100 pl-4">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Invoice ID</p>
                <p className="text-sm font-black">#{invoice.id?.substring(0, 10).toUpperCase() || 'PREVIEW'}</p>
              </div>
              <div className="border-l-2 border-slate-100 pl-4">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Payment Due</p>
                <p className="text-sm font-black text-red-500">{formatDate(invoice.due_date)}</p>
              </div>
           </div>
        </div>

        <div className="rounded-2xl border border-slate-100 overflow-hidden mb-12 shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-900">{item.description}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">{item.quantity} x {formatCurrency(item.rate)}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
           <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Grand Total</p>
                <p className="text-xs text-white/60 mt-1">Due by {formatDate(invoice.due_date)}</p>
              </div>
              <p className="text-3xl font-black">{formatCurrency(invoice.amount || 0)}</p>
           </div>
        </div>

        {((company as any)?.bank_name || (company as any)?.account_name || (company as any)?.account_number) && (
          <div className="mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Instructions</p>
            <div className="flex flex-wrap gap-8">
              {((company as any)?.bank_name) && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</p>
                  <p className="text-sm font-black text-slate-800">{(company as any)?.bank_name}</p>
                </div>
              )}
              {((company as any)?.account_name) && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Name</p>
                  <p className="text-sm font-black text-slate-800">{(company as any)?.account_name}</p>
                </div>
              )}
              {((company as any)?.account_number) && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number</p>
                  <p className="text-sm font-black text-slate-800">{(company as any)?.account_number}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
           <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" /> {company?.address || 'Lagos, Nigeria'}
           </div>
           <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2 truncate">
                <Globe className="h-3 w-3" /> {company?.website || 'lagostech.com'}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" /> {company?.phone || '+234 801 234'}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Fallback to basic templates (Classic, Modern, Minimal)
  return (
    <div className={cn(
      "w-full h-full bg-white p-8 shadow-inner overflow-y-auto font-sans",
      style === 'minimal' && "bg-slate-50"
    )}>
      {/* Header */}
      <div className={cn(
        "flex justify-between items-start mb-10",
        style === 'modern' && "border-b-4 pb-6",
      )} style={style === 'modern' ? { borderImage: `linear-gradient(to right, ${accentColor}, transparent) 1` } : {}}>
        <div>
          {company?.logo ? (
            <img src={company.logo} alt="Logo" className="h-10 w-auto mb-4" />
          ) : (
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: accentColor }}>
              {template.header_text || 'INVOICE'}
            </h1>
          )}
          <p className="text-slate-400 text-sm mt-1">#INV-{invoice.id?.substring(0, 6).toUpperCase() || 'PREVIEW'}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-800">{company?.name || 'Your Company'}</h2>
          <div className="text-slate-500 text-xs mt-1 space-y-0.5">
            <p>{company?.address || '123 Business Ave, Suite 100'}</p>
            <p>{company?.email || 'contact@company.com'}</p>
          </div>
        </div>
      </div>

      {/* Bill To / Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
          <h3 className="text-sm font-bold text-slate-800">{client?.name || 'Select a client'}</h3>
          <p className="text-xs text-slate-500 mt-1">{client?.company || 'Client Company'}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <Mail className="h-3 w-3" /> {client?.email || 'email@client.com'}
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
            <p className="text-xs font-semibold text-slate-800 mb-3">{formatDate(new Date().toISOString())}</p>
            
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
            <p className="text-xs font-semibold text-slate-800" style={{ color: accentColor }}>{formatDate(invoice.due_date)}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-10">
        <table className="w-full text-left">
          <thead>
            <tr className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              style === 'modern' ? "bg-slate-900 text-white" : "border-b border-slate-100 text-slate-400"
            )}>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx} className="text-sm">
                <td className="px-3 py-4 font-medium text-slate-800">{item.description}</td>
                <td className="px-3 py-4 text-center text-slate-500">{item.quantity}</td>
                <td className="px-3 py-4 text-right text-slate-500">{formatCurrency(item.rate)}</td>
                <td className="px-3 py-4 text-right font-bold text-slate-800">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-10">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-700">{formatCurrency(invoice.amount || 0)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Tax (0%)</span>
            <span className="font-semibold text-slate-700">$0.00</span>
          </div>
          <div className={cn(
            "flex justify-between items-center pt-2 mt-2 border-t",
            style === 'modern' && "bg-slate-50 p-2 rounded-lg"
          )}>
            <span className="text-sm font-bold text-slate-800">Total Due</span>
            <span className="text-lg font-black" style={{ color: accentColor }}>{formatCurrency(invoice.amount || 0)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-10 border-t border-slate-100">
        {invoice.notes && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
            <p className="text-xs text-slate-500 leading-relaxed italic">{invoice.notes}</p>
          </div>
        )}
        
        {((company as any)?.bank_name || (company as any)?.account_name || (company as any)?.account_number) && (
          <div className="mb-4 bg-slate-50 p-4 rounded-lg">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Details</p>
            <div className="grid grid-cols-3 gap-4 text-xs">
              {((company as any)?.bank_name) && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Bank Name</span>
                  <span className="font-semibold text-slate-700">{(company as any)?.bank_name}</span>
                </div>
              )}
              {((company as any)?.account_name) && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Account Name</span>
                  <span className="font-semibold text-slate-700">{(company as any)?.account_name}</span>
                </div>
              )}
              {((company as any)?.account_number) && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Account Number</span>
                  <span className="font-semibold text-slate-700">{(company as any)?.account_number}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-400 font-medium tracking-wide">
          {template.footer_text || 'Automated Invoice by Trackam CRM'}
        </p>
      </div>
    </div>
  );
}
