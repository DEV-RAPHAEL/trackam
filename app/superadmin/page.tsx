"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, Building, Users, Ban, CheckCircle, Search, Settings, 
  Crown, KeyRound, Loader2, ArrowRight, LogOut, Globe, Star, 
  Layers, Save, Blocks, Landmark, Wrench, Edit3, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SuperAdminPage() {
  const { currentUser, token, login, logout, addToast } = useStore();
  const router = useRouter();
  
  // Data for platform telemetry
  const [data, setData] = useState<{companies: any[], users: any[], logs: any[], modules: any[]}>({ 
    companies: [], users: [], logs: [], modules: [] 
  });
  const [loading, setLoading] = useState(true);
  
  // Active Console Tab
  const [activeTab, setActiveTab] = useState<'telemetry' | 'cms' | 'modules'>('telemetry');

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // CMS Form States
  const [cmsFields, setCmsFields] = useState<any>({
    hero_title: '',
    hero_subtitle: '',
    price_license: '',
    price_maintenance: '',
    contact_email: '',
    contact_phone: '',
    contact_address: ''
  });
  const [featuresList, setFeaturesList] = useState<any[]>([]);
  const [testimonialsList, setTestimonialsList] = useState<any[]>([]);
  const [savingCms, setSavingCms] = useState(false);

  const isSuper = currentUser?.role === 'superadmin';

  // Fetch Telemetry on mount / auth status change
  useEffect(() => {
    if (!isSuper) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/superadmin', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    })
    .then(d => {
      setData({
        companies: d.companies || [],
        users: d.users || [],
        logs: d.logs || [],
        modules: d.modules || []
      });
      setLoading(false);
    })
    .catch(() => {
      logout();
      setLoading(false);
    });
  }, [isSuper, token, logout]);

  // Fetch CMS Settings on tab activation
  useEffect(() => {
    if (isSuper && activeTab === 'cms') {
      fetch('/api/site-settings')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setCmsFields({
              hero_title: data.hero_title || '',
              hero_subtitle: data.hero_subtitle || '',
              price_license: data.price_license || '',
              price_maintenance: data.price_maintenance || '',
              contact_email: data.contact_email || '',
              contact_phone: data.contact_phone || '',
              contact_address: data.contact_address || ''
            });
            if (data.features) {
              try { setFeaturesList(JSON.parse(data.features)); } catch(e) {}
            }
            if (data.testimonials) {
              try { setTestimonialsList(JSON.parse(data.testimonials)); } catch(e) {}
            }
          }
        })
        .catch(console.error);
    }
  }, [isSuper, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const result = await login(email, password, null);
      if (result && result.requiresOtp) {
        router.push(`/verify-otp?email=${encodeURIComponent(result.email || email)}&type=login_otp`);
        return;
      }
      
      const state = useStore.getState();
      if (state.currentUser?.role !== 'superadmin') {
        state.logout();
        setLoginError('Access denied: Unauthorized credentials.');
      } else {
        addToast('Matrix authorization established', 'success');
      }
    } catch (e) {
      setLoginError('Authentication failed. Please verify credentials.');
    } finally {
      setLoggingIn(false);
    }
  };


  const toggleCompanyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const res = await fetch('/api/superadmin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'suspend_company', targetId: id, status: newStatus })
    });
    if (res.ok) {
      addToast(`Workspace ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`, 'info');
      setData(prev => ({
        ...prev,
        companies: prev.companies.map(c => c.id === id ? { ...c, status: newStatus } : c)
      }));
    } else {
      addToast('Failed to modify workspace status', 'error');
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const res = await fetch('/api/superadmin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'suspend_user', targetId: id, status: newStatus })
    });
    if (res.ok) {
      addToast(`Operator status set to ${newStatus}`, 'info');
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === id ? { ...u, status: newStatus } : u)
      }));
    } else {
      addToast('Failed to modify operator status', 'error');
    }
  };

  // Save Module configuration
  const handleUpdateModule = async (id: string, price: number, status: string) => {
    const res = await fetch('/api/superadmin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'update_module', targetId: id, price, status })
    });
    if (res.ok) {
      addToast('Modular settings updated successfully', 'success');
      setData(prev => ({
        ...prev,
        modules: prev.modules.map(m => m.id === id ? { ...m, price, status } : m)
      }));
    } else {
      addToast('Failed to save module modifications', 'error');
    }
  };

  // Save Landing Page settings
  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCms(true);
    try {
      const payload = {
        ...cmsFields,
        features: JSON.stringify(featuresList),
        testimonials: JSON.stringify(testimonialsList)
      };

      const res = await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        addToast('Naira-native CRM Landing Page updated!', 'success');
      } else {
        addToast('Failed to update landing portal details', 'error');
      }
    } catch(err) {
      addToast('Error synchronizing CMS configs', 'error');
    } finally {
      setSavingCms(false);
    }
  };

  const handleFeatureChange = (index: number, key: string, val: string) => {
    setFeaturesList(prev => prev.map((item, idx) => idx === index ? { ...item, [key]: val } : item));
  };

  const handleTestimonialChange = (index: number, key: string, val: string) => {
    setTestimonialsList(prev => prev.map((item, idx) => idx === index ? { ...item, [key]: val } : item));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Decrypting Platform Matrix...</span>
      </div>
    );
  }

  // ── Render Admin Login Panel ─────────────────────────────────────────────
  if (!isSuper) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>

        <div className="max-w-md w-full relative z-10 space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none">
              Platform Matrix
            </h1>
            <p className="mt-2 text-xs font-black uppercase tracking-widest text-red-500">
              Restricted Administration Node
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/80 space-y-6">
            {loginError && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 text-xs text-red-400 font-medium text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Secure Identifier</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@platform.node"
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Access Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-3 px-4 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-red-950/40 hover:from-red-500 hover:to-red-600 active:scale-95 transition-all disabled:opacity-50"
              >
                {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Authorize Connection
              </button>
            </form>
          </div>

          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest">
              Return to Landing Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Platform Matrix Control Panel ───────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300">
      
      {/* Platform Header */}
      <header className="px-8 py-4 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl text-white tracking-tight leading-none mb-1">Platform Control Node</h1>
            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Global Administrative Workspace</p>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="flex bg-slate-950 border border-slate-800/60 rounded-xl p-1 max-w-sm shrink-0">
          <button 
            onClick={() => setActiveTab('telemetry')}
            className={cn(
              "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              activeTab === 'telemetry' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-white"
            )}
          >
            Telemetry & Directory
          </button>
          <button 
            onClick={() => setActiveTab('cms')}
            className={cn(
              "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              activeTab === 'cms' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-white"
            )}
          >
            Lite CMS
          </button>
          <button 
            onClick={() => setActiveTab('modules')}
            className={cn(
              "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              activeTab === 'modules' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-white"
            )}
          >
            Add-ons Pricing
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest bg-slate-800 border border-slate-700/60 px-4 py-2 rounded-lg">
            Tenant Hub
          </Link>
          <button 
            onClick={() => {
              logout();
              router.push('/superadmin');
            }}
            className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-red-950/20 border border-red-900/30 px-4 py-2 rounded-lg uppercase tracking-widest"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">

        {/* TAB 1: TELEMETRY & DIRECTORY */}
        {activeTab === 'telemetry' && (
          <div className="space-y-12 animate-none">
            
            {/* Global Telemetry Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered Workspaces</span>
                </div>
                <div className="text-4xl font-black text-white">{(data.companies || []).length}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Active Users</span>
                </div>
                <div className="text-4xl font-black text-white">{(data.users || []).length}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paid Core Licenses</span>
                </div>
                <div className="text-4xl font-black text-white">{(data.companies || []).filter(c => c.subscription_status === 'active').length}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-2">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Workspace Trials</span>
                </div>
                <div className="text-4xl font-black text-white">{(data.companies || []).filter(c => c.subscription_status === 'trialing').length}</div>
              </div>
            </div>

            {/* Workspace Directory directory */}
            <div>
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-500" /> Workspace Directory
              </h2>
              
              <div className="space-y-4">
                {(data.companies || []).map(company => {
                  const companyUsers = (data.users || []).filter(u => u.company_id === company.id);
                  const isSuspended = company.status === 'suspended';

                  return (
                    <div key={company.id} className={cn(
                      "bg-slate-900 border rounded-3xl overflow-hidden transition-all shadow-xl",
                      isSuspended ? "border-red-950/40 opacity-70" : "border-slate-800/80"
                    )}>
                      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 bg-slate-900/50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner text-white" style={{ backgroundColor: company.brand_color || '#10b981' }}>
                            {company.name?.[0] || 'W'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-lg font-black text-white tracking-tight">{company.name}</h3>
                              {isSuspended ? (
                                <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border border-red-500/20">Suspended</span>
                              ) : (
                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">Active</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{company.subdomain ? `${company.subdomain}.trackam.com.ng` : 'No custom subdomain link'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Assigned Plan</div>
                            <div className="text-sm font-extrabold text-emerald-400">{company.subscription_status === 'trialing' ? 'Trial Plan' : 'Lifetime Core'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Seats Active</div>
                            <div className="text-sm font-extrabold text-slate-300">{companyUsers.length} Users</div>
                          </div>
                          <button 
                            onClick={() => toggleCompanyStatus(company.id, company.status)}
                            className={cn(
                              "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5",
                              isSuspended ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98]" : "bg-red-600 hover:bg-red-500 text-white shadow-red-950/40 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                          >
                            {isSuspended ? <><CheckCircle className="w-3.5 h-3.5" /> Activate</> : <><Ban className="w-3.5 h-3.5" /> Suspend</>}
                          </button>
                        </div>
                      </div>

                      {/* Workspace Operators Directory */}
                      <div className="bg-slate-950/40 p-6 border-t border-slate-800/20">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Workspace Operators</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {companyUsers.map(user => {
                            const userSuspended = user.status === 'suspended';
                            return (
                              <div key={user.id} className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                userSuspended ? "bg-red-950/10 border-red-900/30 opacity-70" : "bg-slate-900 border-slate-800/60 hover:border-slate-700/60"
                              )}>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5 truncate">
                                    {user.name}
                                    {user.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                                </div>
                                <button
                                  onClick={() => toggleUserStatus(user.id, user.status)}
                                  className={cn(
                                    "p-2 rounded-xl transition-colors border",
                                    userSuspended ? "text-emerald-400 bg-emerald-950/20 border-emerald-900/30 hover:bg-emerald-950/40" : "text-slate-500 bg-slate-950 border-slate-800 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/30"
                                  )}
                                  title={userSuspended ? "Reactivate Operator" : "Suspend Operator"}
                                >
                                  {userSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>
                              </div>
                            );
                          })}
                          {companyUsers.length === 0 && (
                            <p className="text-xs text-slate-600 italic">No operators currently registered inside this workspace.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Audit Trail Log */}
            <div>
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-500" /> Platform Transaction & Action Logs
              </h2>
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Operational Audits</span>
                  <span className="text-[10px] font-bold text-emerald-400">{(data.logs || []).length} Total Logs</span>
                </div>
                
                <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
                  {(data.logs || []).map((log: any) => {
                    const isLicense = log.action === 'License Purchased';
                    const isTrial = log.action === 'Trial Started';
                    
                    return (
                      <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-950/40 transition-colors text-left font-sans">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0",
                              isLicense ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              isTrial ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                              "bg-slate-800 text-slate-400 border-slate-700/60"
                            )}>
                              {log.action}
                            </span>
                            <span className="text-xs text-slate-200 font-bold">
                              {log.description}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                            <span>Workspace: <strong className="text-slate-400">{log.company_name || 'System'}</strong></span>
                            <span>•</span>
                            <span>Operator: <strong className="text-slate-400">{log.user_name || 'System Agent'}</strong></span>
                          </div>
                        </div>
                        
                        <span className="text-[10px] font-bold text-slate-500 shrink-0 uppercase tracking-widest mt-1">
                          {new Date(log.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                  {(data.logs || []).length === 0 && (
                    <div className="p-12 text-center text-slate-600 italic">
                      No platform transaction logs recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LITE CMS LANDING PORTAL CONTROLLER */}
        {activeTab === 'cms' && (
          <div className="space-y-8 animate-none text-left">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-500" /> Landing Portal Config (Lite CMS)
                </h2>
                <p className="text-xs text-slate-500 mt-1">Directly customize landing portal values in real-time. Changes apply instantly.</p>
              </div>
            </div>

            <form onSubmit={handleSaveCms} className="space-y-8">
              
              {/* SECTION: Hero & General Custom Copy */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
                  <Edit3 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Landing Page Hero Banner Copy</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hero Headline Title</label>
                    <input 
                      type="text" 
                      required
                      value={cmsFields.hero_title}
                      onChange={e => setCmsFields({ ...cmsFields, hero_title: e.target.value })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hero Subtitle Paragraph</label>
                    <textarea 
                      rows={3}
                      required
                      value={cmsFields.hero_subtitle}
                      onChange={e => setCmsFields({ ...cmsFields, hero_subtitle: e.target.value })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Core License naira metrics */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
                  <Landmark className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Core License & Maintenance Pricing copy</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Lifetime License Price Tag (Naira)</label>
                    <input 
                      type="text" 
                      required
                      value={cmsFields.price_license}
                      onChange={e => setCmsFields({ ...cmsFields, price_license: e.target.value })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Annual Maintenance copy</label>
                    <input 
                      type="text" 
                      required
                      value={cmsFields.price_maintenance}
                      onChange={e => setCmsFields({ ...cmsFields, price_maintenance: e.target.value })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Features list structured editors */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
                  <Blocks className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Dynamic Landing Features Grid (6 Items)</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuresList.map((feat, index) => (
                    <div key={index} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded uppercase">Feature #{index + 1} ({feat.icon})</span>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Feature Title</label>
                        <input 
                          type="text" 
                          required
                          value={feat.title}
                          onChange={e => handleFeatureChange(index, 'title', e.target.value)}
                          className="block w-full rounded-lg border border-slate-800 bg-slate-900 text-white py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Description Description</label>
                        <textarea 
                          rows={2}
                          required
                          value={feat.desc}
                          onChange={e => handleFeatureChange(index, 'desc', e.target.value)}
                          className="block w-full rounded-lg border border-slate-800 bg-slate-900 text-white py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: Testimonials editor */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Customer Testimonial Reels (3 Items)</span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {testimonialsList.map((test, index) => (
                    <div key={index} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded uppercase">Testimonial #{index + 1} ({test.location})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Reviewer Name</label>
                          <input 
                            type="text" 
                            required
                            value={test.name}
                            onChange={e => handleTestimonialChange(index, 'name', e.target.value)}
                            className="block w-full rounded-lg border border-slate-800 bg-slate-900 text-white py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Company Role</label>
                          <input 
                            type="text" 
                            required
                            value={test.role}
                            onChange={e => handleTestimonialChange(index, 'role', e.target.value)}
                            className="block w-full rounded-lg border border-slate-800 bg-slate-900 text-white py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Region/Location</label>
                          <input 
                            type="text" 
                            required
                            value={test.location}
                            onChange={e => handleTestimonialChange(index, 'location', e.target.value)}
                            className="block w-full rounded-lg border border-slate-800 bg-slate-900 text-white py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Quote Description</label>
                        <textarea 
                          rows={2}
                          required
                          value={test.text}
                          onChange={e => handleTestimonialChange(index, 'text', e.target.value)}
                          className="block w-full rounded-lg border border-slate-800 bg-slate-900 text-white py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: Location contact spec overrides */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
                  <Wrench className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">Location Contact Specifications overrides</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Contact Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={cmsFields.contact_email}
                      onChange={e => setCmsFields({ ...cmsFields, contact_email: e.target.value })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">WhatsApp / Phone Number</label>
                    <input 
                      type="text" 
                      required
                      value={cmsFields.contact_phone}
                      onChange={e => setCmsFields({ ...cmsFields, contact_phone: e.target.value })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Corporate HQ Address</label>
                    <input 
                      type="text" 
                      required
                      value={cmsFields.contact_address}
                      onChange={e => setCmsFields({ ...cmsFields, contact_address: e.target.value })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* CMS Save actions bar */}
              <div className="flex justify-end p-2">
                <button
                  type="submit"
                  disabled={savingCms}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 py-3.5 px-8 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {savingCms ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save CMS Configurations
                </button>
              </div>

            </form>
          </div>
        )}

        {/* TAB 3: MODULAR ADD-ONS CONFIGURATION */}
        {activeTab === 'modules' && (
          <div className="space-y-8 animate-none text-left">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Blocks className="w-5 h-5 text-emerald-500" /> Modular Platform Extensions
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configure price settings and platform lock defaults for expanding company modules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(data.modules || []).map((mod) => (
                <div key={mod.id} className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{mod.name}</h3>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">SLUG: {mod.slug}</p>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border",
                      mod.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      mod.status === 'available' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {mod.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{mod.description}</p>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const price = Number(formData.get('price'));
                      const status = formData.get('status') as string;
                      handleUpdateModule(mod.id, price, status);
                    }}
                    className="pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-4 items-end"
                  >
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Module Price tag ($ USD)</label>
                      <input 
                        type="number" 
                        name="price"
                        required
                        defaultValue={mod.price}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Availability lock</label>
                      <select 
                        name="status"
                        defaultValue={mod.status}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 text-white py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      >
                        <option value="locked">Locked (Under Dev)</option>
                        <option value="available">Available for Purchase</option>
                        <option value="active">Active (Pre-unlocked)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="col-span-2 mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-white py-2.5 transition-all shadow-sm border border-slate-700/60"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  </form>

                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
