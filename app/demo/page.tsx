"use client";

import React, { useState } from 'react';
import { ShieldCheck, User, Users, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';

const DEMO_ACCOUNTS = [
  {
    role: 'owner',
    name: 'Sarah Okonkwo',
    title: 'Workspace Owner / Executive',
    email: 'owner@demo.trackam.com',
    password: 'demo1234',
    icon: ShieldCheck,
    color: 'from-amber-500 to-amber-600',
    borderColor: 'hover:border-amber-500/30',
    glowColor: 'shadow-amber-500/10',
    badge: 'Full Access'
  },
  {
    role: 'admin',
    name: 'James Adeyemi',
    title: 'System Administrator',
    email: 'admin@demo.trackam.com',
    password: 'demo1234',
    icon: User,
    color: 'from-indigo-500 to-indigo-600',
    borderColor: 'hover:border-indigo-500/30',
    glowColor: 'shadow-indigo-500/10',
    badge: 'Manager'
  },
  {
    role: 'user',
    name: 'Amaka Eze',
    title: 'Staff Associate / Operator',
    email: 'staff@demo.trackam.com',
    password: 'demo1234',
    icon: Users,
    color: 'from-emerald-500 to-emerald-600',
    borderColor: 'hover:border-emerald-500/30',
    glowColor: 'shadow-emerald-500/10',
    badge: 'Restricted'
  }
];

export default function DemoPage() {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const launchSandbox = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setLoadingRole(account.role);
    setErrorMsg('');
    try {
      // 1. Seed demo database (idempotent POST)
      const seedRes = await fetch('/api/demo-seed', { method: 'POST' });
      if (!seedRes.ok) {
        throw new Error('Database seeding failed');
      }

      // 2. Perform backend login for the selected role
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: account.password, subdomain: 'democo' })
      });

      if (!loginRes.ok) {
        throw new Error('Sandbox authentication failed');
      }

      const { token } = await loginRes.json();

      // 3. Dynamic subdomain redirect
      const protocol = window.location.protocol;
      const host = window.location.host; // e.g. localhost:3000 or trackam.com
      const portPart = host.includes(':') ? `:${host.split(':')[1]}` : '';
      const baseDomain = host.split(':')[0].replace('www.', '');

      const dashboardUrl = `${protocol}//democo.${baseDomain}${portPart}/dashboard?token=${token}`;

      // Redirect browser to the private tenant origin
      window.location.href = dashboardUrl;
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'An error occurred during sandbox launching.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      
      {/* Decorative Grid and Glowing Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35"></div>
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex justify-center items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-900/30">T</div>
            <span className="font-extrabold text-3xl tracking-tight text-white">Trackam CRM</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none sm:text-5xl">
            SaaS Interactive Sandbox
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            Deploy a sandboxed organization and instantly assume any operational role to experience multi-tenant CRM workspace isolation.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 text-sm text-red-400 font-semibold text-center max-w-md mx-auto">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_ACCOUNTS.map(account => {
            const IconComponent = account.icon;
            const isCurrentLoading = loadingRole === account.role;
            const isAnyLoading = loadingRole !== null;

            return (
              <div 
                key={account.role}
                className={`bg-slate-900/40 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 shadow-2xl shadow-black/60 relative overflow-hidden group ${account.borderColor} ${account.glowColor}`}
              >
                {/* Background glow decoration */}
                <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-24 h-24 bg-gradient-to-br ${account.color} opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-all duration-300`}></div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${account.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-700/60">
                      {account.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{account.name}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{account.title}</p>
                  <p className="text-xs text-slate-400 mt-4 font-mono select-all bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80 inline-block">{account.email}</p>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => launchSandbox(account)}
                    disabled={isAnyLoading}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${account.color} py-3 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100`}
                  >
                    {isCurrentLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Launch Node
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest">
            Back to Public Entrance
          </Link>
        </div>
      </div>
    </div>
  );
}
