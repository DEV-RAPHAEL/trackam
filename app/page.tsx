"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Users, Target, Briefcase, Blocks, Infinity, CreditCard, Rocket, CheckCircle2, BookOpen, LifeBuoy, Layers } from 'lucide-react';

import { useStore } from '@/lib/store';

export default function Landing() {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const cleanHostname = hostname.split(':')[0];
      const mainDomains = ['localhost', 'trackam.ng', 'www.trackam.ng'];
      
      if (!mainDomains.includes(cleanHostname)) {
        router.push('/login');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Header */}
      <header className="px-6 sm:px-12 py-6 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">T</div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Trackam</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
          <Link href="/register" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-24 pb-24 px-6 sm:px-12 max-w-6xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Business tracking, <br/><span className="text-indigo-600">zero complexity.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Replace spreadsheets and scattered tools with a centralized business control system. Trackam is the lightweight modular CRM that grows exactly when you need it to.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2">
              Start your Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Unlimited Section */}
        <div className="mt-24 w-full bg-slate-900 rounded-3xl p-8 sm:p-16 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 text-slate-800/50">
            <Infinity className="w-64 h-64" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-500/30">
              <Infinity className="w-3 h-3" /> No limits
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Unlimited everything. <br/>No per-seat pricing.
            </h2>
            <p className="text-slate-400 font-medium leading-relaxed mb-8">
              We don't punish you for growing. Add as many team members, clients, leads, and deals as you need. Your enterprise runs on one flat fee, forever.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-2xl font-black text-white">∞</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Users</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-2xl font-black text-white">∞</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Clients</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-2xl font-black text-white">∞</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Deals</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-2xl font-black text-white">∞</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tasks</div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">From setup to working in minutes</h2>
            <p className="mt-4 text-slate-500 font-medium">A streamlined onboarding process designed for busy founders.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-slate-200 z-0"></div>
            
            <div className="relative z-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                <Users className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border-2 border-white absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black text-slate-400 shadow-sm">1</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sign Up</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Create your workspace. Enter your company details and invite your core team members instantly.</p>
            </div>
            
            <div className="relative z-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg -rotate-3">
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border-2 border-white absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black text-slate-400 shadow-sm">2</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Make your one-off setup payment securely. No hidden tier walls, no per-user subscriptions.</p>
            </div>
            
            <div className="relative z-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                <Rocket className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border-2 border-white absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black text-slate-400 shadow-sm">3</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Easy Onboarding</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Jump right in with our guided setup. Your system is fully ready to capture leads and deals instantly.</p>
            </div>
          </div>
        </div>

        {/* Modules Explanation */}
        <div className="mt-32 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-100">
              <Layers className="w-3 h-3" /> The Module System
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
              Start with a CRM.<br/>Build an entire OS.
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed mb-8">
              We built Trackam to be incredibly lightweight out of the box. You only see the features you need right now. When your business grows, simply unlock specialized modules.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Core CRM (Default)</span>
                  <p className="text-sm text-slate-500">Clients, Leads, Deals, Tasks, Invoices.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Accounting Module (Optional Upgrade)</span>
                  <p className="text-sm text-slate-500">Double-entry ledger, expense tracking.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">HR Module (Optional Upgrade)</span>
                  <p className="text-sm text-slate-500">Payroll, attendance, employee records.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-slate-100 p-8 rounded-3xl border border-slate-200">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 rotate-2 hover:rotate-0 transition-transform duration-300">
               <div className="flex justify-between items-start mb-4">
                 <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600"><Blocks className="w-8 h-8" /></div>
                 <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Locked</span>
               </div>
               <h3 className="text-xl font-bold text-slate-900">POS System</h3>
               <p className="text-sm text-slate-500 mt-2 mb-6">Manage in-store sales and inventory seamlessly.</p>
               <button className="w-full bg-slate-900 text-white rounded-lg py-3 text-sm font-bold uppercase hover:bg-slate-800 transition-colors">Unlock Module</button>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-32 w-full max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Transparent Enterprise Pricing</h2>
            <p className="mt-4 text-slate-500 font-medium">One payment. No surprises.</p>
          </div>
          
          <div className="bg-white rounded-3xl border-2 border-indigo-500 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
              Most Popular
            </div>
            <div className="p-8 sm:p-12 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Lifetime Core License</h3>
                <p className="text-slate-500 font-medium mb-6">Get complete access to the core CRM with unrestricted capacity.</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black text-slate-900">₦1.2M</span>
                  <span className="text-slate-500 font-bold">one-off</span>
                </div>
                <div className="text-sm font-bold text-indigo-600 mb-8">+ ₦100k yearly maintenance & support</div>
                
                <Link href="/register" className="block w-full text-center px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold uppercase tracking-wide rounded-xl transition-colors shadow-sm">
                  Initialize Setup
                </Link>
              </div>
              <div className="flex-1 w-full bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Full CRM System MVP
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Unlimited Team Members
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Unlimited Clients & Deals
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Access to Module Expansion Store
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> White-glove Onboarding
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Secure Cloud Hosting
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Docs */}
        <div className="mt-32 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center hover:border-indigo-200 transition-colors">
              <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Extensive Documentation</h3>
              <p className="text-slate-500 font-medium mb-6 max-w-sm">From quickstarts to deep API references. Our docs are readily available and continuously updated.</p>
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-500">Read the Docs →</button>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center hover:border-indigo-200 transition-colors">
              <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mb-6">
                <LifeBuoy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">24/7 Priority Support</h3>
              <p className="text-slate-500 font-medium mb-6 max-w-sm">Hit a snag? Our dedicated support team is available around the clock to solve issues instantly.</p>
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-500">Contact Support →</button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center font-bold text-white text-xs">T</div>
             <span className="font-bold tracking-tight text-slate-900">Trackam</span>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">© {new Date().getFullYear()} Trackam. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900">Terms</a>
            <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
