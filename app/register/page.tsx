"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { Building, User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function Register() {
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const registerCompany = useStore(state => state.registerCompany);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subdomain') || params.get('company');
      if (sub) {
        // Pre-fill company name, capitalize it nicely
        const capitalized = sub.charAt(0).toUpperCase() + sub.slice(1);
        setCompanyName(capitalized);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    
    try {
      const res = await registerCompany(companyName, name, email, password);
      if (res.success && res.subdomain) {
        // Step 3: Redirect to tenant login page on the dynamic subdomain context
        const protocol = window.location.protocol;
        const host = window.location.host; // e.g. localhost:3000 or trackam.com
        
        const portPart = host.includes(':') ? `:${host.split(':')[1]}` : '';
        const baseDomain = host.split(':')[0].replace('www.', '');
        
        const tenantLoginUrl = `${protocol}//${res.subdomain}.${baseDomain}${portPart}/login?registered=true`;
        
        // Use full page reload/href to hop subdomains/origins safely
        window.location.href = tenantLoginUrl;
      } else {
        setErrorMsg('Failed to initialize workspace. Please try another company name.');
        setIsSubmitting(false);
      }
    } catch (e) {
      setErrorMsg('An unexpected error occurred during company creation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex justify-center items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-md">T</div>
          <span className="font-extrabold text-3xl tracking-tight text-slate-900">Trackam</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">
          Initialize Your Workspace
        </h2>
        <p className="text-slate-500 text-sm">
          Set up your private company CRM node in under a minute
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px] relative z-10">
        <div className="bg-white px-8 py-10 shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-3xl space-y-6">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-xs text-red-700 font-semibold p-3.5 rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="companyName" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Company / Organization Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  id="companyName"
                  required
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Acme Corporation"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Administrator Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="jane@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Workspace Access Key (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 px-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Register & Provision Node
            </button>
          </form>

          <div className="border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Already have a workspace?{' '}
              <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
