"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { Zap, Crown, Shield, User, Loader2, Sparkles, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'Owner',
    name: 'Sarah Okonkwo',
    email: 'owner@demo.trackam.com',
    password: 'demo1234',
    description: 'Full access — billing, team, all settings',
    icon: Crown,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    iconColor: 'text-amber-500',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    role: 'Admin',
    name: 'James Adeyemi',
    email: 'admin@demo.trackam.com',
    password: 'demo1234',
    description: 'Manage data, team & reports. No billing.',
    icon: Shield,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    iconColor: 'text-indigo-500',
    badgeColor: 'bg-indigo-100 text-indigo-800',
  },
  {
    role: 'Staff',
    name: 'Amaka Eze',
    email: 'staff@demo.trackam.com',
    password: 'demo1234',
    description: 'CRM access — clients, leads, tasks only.',
    icon: User,
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    iconColor: 'text-slate-400',
    badgeColor: 'bg-slate-100 text-slate-600',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const login = useStore(state => state.login);
  const router = useRouter();

  const [tenant, setTenant] = useState<{name: string, logo: string, brand_color: string} | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [tenantError, setTenantError] = useState(false);
  const [isTenantLoading, setIsTenantLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    const cleanHostname = hostname.split(':')[0];
    const mainDomains = ['localhost', 'trackam.ng', 'www.trackam.ng'];
    
    if (mainDomains.includes(cleanHostname)) {
      router.push('/demo');
    } else {
      const sub = cleanHostname.split('.')[0];
      setSubdomain(sub);
      fetch(`/api/tenant/${sub}`)
        .then(r => r.json())
        .then(data => {
          if (data && !data.error) {
            setTenant(data);
          } else {
            setTenantError(true);
          }
        })
        .catch(e => {
          console.error(e);
          setTenantError(true);
        })
        .finally(() => {
          setIsTenantLoading(false);
        });
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password, subdomain);
    setIsLoading(false);
    if (result && result.requiresOtp) {
      router.push(`/verify-otp?email=${encodeURIComponent(result.email || email)}&type=login_otp`);
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoLoading(account.role);
    try {
      setIsSeeding(true);
      await fetch('/api/demo-seed', { method: 'POST' });
      setIsSeeding(false);
      // Demo login goes through same flow — if OTP required, redirect
      const result = await login(account.email, account.password, subdomain);
      if (result && result.requiresOtp) {
        router.push(`/verify-otp?email=${encodeURIComponent(result.email || account.email)}&type=login_otp`);
      } else {
        router.push('/dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDemoLoading(null);
      setIsSeeding(false);
    }
  };

  if (isTenantLoading && !tenantError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (tenantError) {
    const handleClaimWorkspace = () => {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const portPart = host.includes(':') ? `:${host.split(':')[1]}` : '';
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
      
      window.location.href = `${protocol}//${mainDomain}${portPart}/register?subdomain=${subdomain}`;
    };

    const handleGoToDemo = () => {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const portPart = host.includes(':') ? `:${host.split(':')[1]}` : '';
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
      
      window.location.href = `${protocol}//${mainDomain}${portPart}/demo`;
    };

    return (
      <div className="min-h-screen bg-slate-950 font-sans text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Dynamic ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Constellation micro-dots for playfulness */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="text-center max-w-lg relative z-10 w-full px-4">
          {/* Fun, animated icon container */}
          <div className="relative w-24 h-24 mx-auto mb-8 group">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl group-hover:bg-indigo-500/35 transition-all duration-500 scale-110"></div>
            
            {/* Spinning/breathing visual border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 animate-spin duration-[12000ms] ease-linear">
              <div className="w-full h-full bg-slate-900 rounded-[22px]"></div>
            </div>
            
            {/* Core Icon Box */}
            <div className="absolute inset-1 bg-slate-900 rounded-[22px] flex items-center justify-center shadow-lg border border-slate-800">
              <Sparkles className="w-10 h-10 text-indigo-400 animate-bounce duration-[3000ms]" />
            </div>
            
            {/* Decorative floaters */}
            <span className="absolute -top-1 -right-1 text-2xl animate-bounce delay-150">🚀</span>
            <span className="absolute -bottom-2 -left-2 text-xl animate-bounce delay-500">✨</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-4 tracking-wide uppercase">
            Workspace Available 🌐
          </span>

          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            Claim Your Cosmic <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              {subdomain}
            </span> Space!
          </h2>

          <p className="text-slate-400 mb-10 leading-relaxed text-base max-w-md mx-auto">
            We searched high and low, but the workspace <strong className="text-slate-200">"{subdomain}"</strong> hasn't been claimed yet. The good news? It can be yours today!
          </p>

          {/* Premium CTA Box */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl mb-8 space-y-4 max-w-md mx-auto">
            <p className="text-sm font-medium text-slate-300">
              ⚡ You're first in line! Initialize your workspace and secure this custom address now.
            </p>
            
            <button
              onClick={handleClaimWorkspace}
              className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-px font-bold text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative py-3.5 px-6 bg-slate-900/40 rounded-[15px] group-hover:bg-slate-900/10 transition-colors flex items-center justify-center gap-2">
                <span>Own This Workspace Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-semibold">
            <button 
              onClick={handleGoToDemo}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer group"
            >
              <span>Explore full interactive demo</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-sm">T</div>
                <span className="font-bold text-3xl tracking-tight text-slate-900">Trackam</span>
              </div>
              <h2 className="text-center text-2xl font-bold tracking-tight text-slate-800 mb-2">
                Sign in to your workspace
              </h2>
              {tenant && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-6">
                  Workspace: {tenant.name}
                </span>
              )}
            </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[520px] space-y-4">

        {/* ── Demo Quick Login (Only on root domain, if accessed directly) ── */}
        {!tenant && (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-500 fill-indigo-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                  Try Demo — 1-click login
                </span>
                {isSeeding && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                    <Loader2 className="h-3 w-3 animate-spin" /> Seeding data…
                  </span>
                )}
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_ACCOUNTS.map((account) => {
                  const Icon = account.icon;
                  const loading = demoLoading === account.role;
                  return (
                    <button
                      key={account.role}
                      onClick={() => handleDemoLogin(account)}
                      disabled={!!demoLoading}
                      className={`group relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${account.color}`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <Icon className={`h-5 w-5 ${account.iconColor}`} />
                        {loading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-current opacity-60" />
                        ) : (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${account.badgeColor}`}>
                            {account.role}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-0.5">{account.name}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{account.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="px-4 pb-4">
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  All demo accounts use password: <span className="text-slate-600">demo1234</span>
                </p>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or sign in manually</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </>
        )}

        {/* ── Normal Login Form ─────────────────────────────────────── */}
        <div className="bg-white px-6 py-8 shadow-sm border border-slate-200 rounded-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold leading-6 text-slate-800">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm outline-none transition-all"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold leading-6 text-slate-800">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-all disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          {!tenant && (
            <p className="mt-6 text-center text-sm text-slate-500 font-medium">
              Not a member?{' '}
              <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                Register your company
              </Link>
            </p>
          )}
        </div>

        {/* ── Powered by Footer (Only for Tenants) ────────────────── */}
        {tenant && (
          <div className="mt-8 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              Powered by 
              <span className="text-slate-600 flex items-center gap-1">
                <span className="w-3 h-3 bg-slate-400 rounded-sm flex items-center justify-center text-white text-[8px]">T</span>
                Trackam
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
