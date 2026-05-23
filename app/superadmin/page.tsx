"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Building, Users, Ban, CheckCircle, Search, Settings, Crown, KeyRound, Loader2, ArrowRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SuperAdminPage() {
  const { currentUser, token, login, logout } = useStore();
  const router = useRouter();
  
  // Data for platform telemetry
  const [data, setData] = useState<{companies: any[], users: any[], logs: any[]}>({ companies: [], users: [], logs: [] });
  const [loading, setLoading] = useState(true);
  
  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const isSuper = currentUser?.role === 'superadmin';

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
      setData(d);
      setLoading(false);
    })
    .catch(() => {
      // If token expired or invalid, log out
      logout();
      setLoading(false);
    });
  }, [isSuper, token, logout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await login(email, password, null);
      
      // Wait for state to synchronize
      const state = useStore.getState();
      if (state.currentUser?.role !== 'superadmin') {
        state.logout();
        setLoginError('Access denied: Unauthorized credentials.');
      }
    } catch (e) {
      setLoginError('Authentication failed. Please verify credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const toggleCompanyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await fetch('/api/superadmin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'suspend_company', targetId: id, status: newStatus })
    });
    setData(prev => ({
      ...prev,
      companies: prev.companies.map(c => c.id === id ? { ...c, status: newStatus } : c)
    }));
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await fetch('/api/superadmin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'suspend_user', targetId: id, status: newStatus })
    });
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, status: newStatus } : u)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
        <span className="text-sm font-black uppercase tracking-widest text-slate-500">Decrypting Platform Matrix...</span>
      </div>
    );
  }

  // ── Render Admin Login Panel ─────────────────────────────────────────────
  if (!isSuper) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        {/* Decorative Neon Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>

        <div className="max-w-md w-full relative z-10 space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/10 animate-pulse">
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
      <header className="px-8 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-xl text-white tracking-tight leading-none mb-1">Platform Matrix</h1>
            <p className="text-[9px] text-red-400 font-black uppercase tracking-widest">Global Administration Console</p>
          </div>
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

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        {/* Global Telemetry */}
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

        {/* Workspace Telemetry */}
        <div>
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-5 h-5 text-red-500" /> Workspace Directory
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
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner text-white" style={{ backgroundColor: company.brand_color || '#4f46e5' }}>
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
                        <p className="text-xs text-slate-500 mt-0.5">{company.subdomain ? `${company.subdomain}.trackam.ng` : 'No custom subdomain link'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Assigned Plan</div>
                        <div className="text-sm font-extrabold text-indigo-400">{company.subscription_status === 'trialing' ? 'Trial Plan' : 'Lifetime Core'}</div>
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

                  {/* Users inside Company */}
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
                              title={userSuspended ? "Reactivate User" : "Suspend User"}
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
            {(data.companies || []).length === 0 && (
              <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-3xl">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">No Workspaces Registered</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Audit & Billing Logs */}
        <div className="mt-12">
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" /> Platform Billing & Activity Log
          </h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Transaction & Operational Audits</span>
              <span className="text-[10px] font-bold text-indigo-400">{(data.logs || []).length} Total Logs</span>
            </div>
            
            <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
              {(data.logs || []).map((log: any) => {
                const isLicense = log.action === 'License Purchased';
                const isTrial = log.action === 'Trial Started';
                
                return (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-950/40 transition-colors text-left">
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
                  No platform transactions or action logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
