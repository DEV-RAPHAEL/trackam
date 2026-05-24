"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Palette, Building, Globe, Mail, Phone, MapPin, Upload, Check, Save, User, Users, Trash2, Settings as SettingsIcon, Package, Lock, Unlock } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';

const PaymentButton = dynamic(
  () => import('@/components/PaymentButton').then((mod) => mod.PaymentButton),
  { ssr: false }
);

export default function SettingsPage() {
  const { currentCompany, currentUser, updateCompanyBranding, addToast, modules, unlockModule, team, addUser, deleteUser, resendInvite } = useStore();
  const [activeTab, setActiveTab] = useState<'branding' | 'team' | 'modules'>('branding');
  
  const [baseDomain, setBaseDomain] = useState('trackam.ng');
  
  const [form, setForm] = useState({
    name: currentCompany?.name || '',
    email: currentCompany?.email || '',
    phone: currentCompany?.phone || '',
    website: currentCompany?.website || '',
    address: currentCompany?.address || '',
    brand_color: currentCompany?.brand_color || '#4f46e5',
    logo: currentCompany?.logo || '',
    subdomain: currentCompany?.subdomain || '',
    bank_name: currentCompany?.bank_name || '',
    account_name: currentCompany?.account_name || '',
    account_number: currentCompany?.account_number || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      const hostWithoutPort = host.split(':')[0];
      const hostParts = hostWithoutPort.split('.');
      
      let mainDomain = '';
      if (hostParts.length > 2) {
        mainDomain = hostParts.slice(1).join('.');
      } else if (hostParts.length === 2 && hostParts[1] !== 'localhost') {
        mainDomain = hostParts.join('.');
      } else {
        mainDomain = 'localhost';
      }
      
      const portPart = host.includes(':') ? `:${host.split(':')[1]}` : '';
      setBaseDomain(`${mainDomain}${portPart}`);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const sub = form.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '').replace(/(^-|-$)/g, '');
      if (form.subdomain && !sub) {
        addToast('Invalid subdomain format', 'error');
        setIsSaving(false);
        return;
      }

      const res = await fetch(`/api/companies/${currentCompany?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        addToast(data.error || 'Failed to update settings', 'error');
        setIsSaving(false);
        return;
      }
      
      updateCompanyBranding(form);
      addToast('Settings updated successfully ✓', 'success');
      
      if (currentCompany && sub && currentCompany.subdomain !== sub) {
        addToast('Subdomain changed! Redirecting to new address...', 'info');
        setTimeout(() => {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const portPart = host.includes(':') ? `:${host.split(':')[1]}` : '';
          window.location.href = `${protocol}//${sub}.${baseDomain.split(':')[0]}${portPart}/settings`;
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      addToast('An unexpected error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const presetColors = [
    '#4f46e5', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#1e293b', // Slate
    '#111111', // Black
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your company profile and branding.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Navigation */}
        <div className="space-y-1">
           <button 
            onClick={() => setActiveTab('branding')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-all",
              activeTab === 'branding' 
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
            )}
           >
              <Palette className="h-4 w-4" /> Branding & Profile
           </button>
           <button 
            onClick={() => setActiveTab('modules')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-all",
              activeTab === 'modules' 
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
            )}
           >
              <Package className="h-4 w-4" /> Modules & Subscription
           </button>
           <button 
            onClick={() => setActiveTab('team')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-all",
              activeTab === 'team' 
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
            )}
           >
              <Users className="h-4 w-4" /> Team Management
           </button>
        </div>

        {activeTab === 'branding' && (
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="space-y-8">
              {/* Branding Card */}
              <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Company Branding</span>
                    </div>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: form.brand_color }} />
                 </div>
                 
                 <div className="p-6 space-y-6">
                    {/* Logo Mockup */}
                    <div className="flex items-start gap-6">
                       <div className="relative group">
                          <div className="h-24 w-24 rounded-2xl bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 overflow-hidden">
                             {form.logo ? (
                               <img src={form.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                             ) : (
                               <>
                                 <Upload className="h-6 w-6 mb-1" />
                                 <span className="text-[10px] font-bold uppercase">Upload</span>
                               </>
                             )}
                          </div>
                          <input 
                             type="file"
                             accept="image/*"
                             className="hidden"
                             id="logo-upload"
                             onChange={e => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onload = (event) => {
                                   setForm({ ...form, logo: event.target?.result as string });
                                 };
                                 reader.readAsDataURL(file);
                               }
                             }}
                          />
                          <label htmlFor="logo-upload" className="mt-3 cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-white/10 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors w-full text-center">
                            Upload Image
                          </label>
                       </div>
                       <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Brand Accent Color</label>
                          <div className="flex flex-wrap gap-2 mb-4">
                             {presetColors.map(c => (
                               <button
                                 key={c}
                                 type="button"
                                 onClick={() => setForm({...form, brand_color: c})}
                                 className={cn(
                                   "h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center",
                                   form.brand_color === c 
                                     ? "border-slate-800 dark:border-white scale-110 shadow-lg" 
                                     : "border-transparent hover:scale-105"
                                 )}
                                 style={{ backgroundColor: c }}
                               >
                                 {form.brand_color === c && <Check className="h-4 w-4 text-white" />}
                               </button>
                             ))}
                             <input 
                               type="color" 
                               value={form.brand_color} 
                               onChange={e => setForm({...form, brand_color: e.target.value})}
                               className="h-8 w-8 rounded-full bg-transparent border-none cursor-pointer" 
                             />
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed italic">This color will be used for your invoice headers, highlights, and primary buttons.</p>
                       </div>
                    </div>
                 </div>
              </div>
  
              {/* Subdomain Card */}
              <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Workspace Address</span>
                 </div>
                 
                 <div className="p-6 space-y-4">
                    <div>
                       <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Workspace Subdomain</label>
                       <div className="flex rounded-lg shadow-sm">
                          <input
                             type="text"
                             disabled={currentUser?.role !== 'owner'}
                             value={form.subdomain}
                             onChange={e => setForm({...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '')})}
                             className="block w-full rounded-l-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-60"
                             placeholder="my-company"
                          />
                          <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-sm font-medium">
                             .{baseDomain}
                          </span>
                       </div>
                       
                       <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                          Your current workspace URL is: <span className="font-bold text-emerald-600 dark:text-emerald-400">{form.subdomain || 'your-subdomain'}.{baseDomain}</span>
                       </p>
                    </div>

                    {currentUser?.role === 'owner' ? (
                       <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
                          <span className="text-amber-500 text-base leading-none">⚠️</span>
                          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                             <strong>Warning:</strong> Changing your subdomain will immediately update your workspace URL. 
                             You and your team members will need to use the new URL to log in. 
                             You will be automatically redirected to the new address upon saving.
                          </p>
                       </div>
                    ) : (
                       <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-start gap-2">
                          <span className="text-slate-400 dark:text-slate-500 text-xs">ℹ️</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-none">
                             Only the workspace owner can modify the subdomain.
                          </p>
                       </div>
                    )}
                 </div>
              </div>

              {/* Profile Info */}
              <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Company Profile</span>
                 </div>
                 
                 <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Business Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Contact Email</label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                         <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                      <div className="relative">
                         <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                         <input
                          type="text"
                          value={form.phone}
                          onChange={e => setForm({...form, phone: e.target.value})}
                          className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Website</label>
                      <div className="relative">
                         <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                         <input
                          type="text"
                          value={form.website}
                          onChange={e => setForm({...form, website: e.target.value})}
                          className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                          placeholder="www.yourcompany.com"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Business Address</label>
                      <div className="relative">
                         <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                         <input
                          type="text"
                          value={form.address}
                          onChange={e => setForm({...form, address: e.target.value})}
                          className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        />
                      </div>
                    </div>
                 </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Bank Details</span>
                 </div>
                 
                 <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Bank Name</label>
                      <input
                        type="text"
                        value={form.bank_name}
                        onChange={e => setForm({...form, bank_name: e.target.value})}
                        className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        placeholder="e.g. Chase Bank"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Account Name</label>
                      <input
                        type="text"
                        value={form.account_name}
                        onChange={e => setForm({...form, account_name: e.target.value})}
                        className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Account Number</label>
                      <input
                        type="text"
                        value={form.account_number}
                        onChange={e => setForm({...form, account_number: e.target.value})}
                        className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                 </div>
              </div>
  
              <div className="flex justify-end pt-4">
                 <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                 >
                    {isSaving ? <Upload className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Branding Changes
                 </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="md:col-span-2 space-y-6">
            {/* Add Team Member Card */}
            {currentUser?.role === 'owner' && (
              <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Add Team Member</span>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get('name') as string;
                    const email = formData.get('email') as string;
                    const role = formData.get('role') as any;
                    
                    if (currentCompany) {
                      addUser({
                        name,
                        email,
                        role
                      });
                      e.currentTarget.reset();
                    }
                  }}
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                      <input name="name" required type="text" className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                      <input name="email" required type="email" className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                    </div>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Access Level</label>
                      <select name="role" required className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        <option value="user" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">User (Basic Access)</option>
                        <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Admin (Manage Data)</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
                      Invite Member
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Team List Card */}
            <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Team Members</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{(team || []).length} Total</span>
               </div>
               
               <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {(team || []).map((member) => (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-350 font-bold text-xs">
                          {member.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full",
                          member.role === 'owner' ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" :
                          member.role === 'admin' ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" :
                          "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        )}>
                          {member.role}
                        </span>
                        {currentUser?.role === 'owner' && member.id !== currentUser.id && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => resendInvite(member.id)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all"
                              title="Resend Invite"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteUser(member.id)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-450 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                              title="Remove Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {(modules || []).map((module) => (
                <div key={module.id} className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 p-6 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      module.status === 'active' 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" 
                        : "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500"
                    )}>
                      {module.status === 'active' ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">{module.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">{module.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          {formatCurrency(module.price)}/mo
                        </span>
                        {module.status === 'active' && (
                          <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {module.status !== 'active' ? (
                    <PaymentButton 
                      amount={module.price}
                      email={currentUser?.email || ''}
                      metadata={{ moduleId: module.id }}
                      onSuccess={(ref) => {
                        unlockModule(module.id);
                        addToast(`Module ${module.name} activated!`, 'success');
                      }}
                      label="Upgrade"
                      className="px-6 py-2 text-xs"
                    />
                  ) : (
                    <button disabled className="bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 font-bold py-2 px-6 rounded-lg text-xs cursor-not-allowed">
                      Purchased
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
