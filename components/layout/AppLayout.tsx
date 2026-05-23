"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useStore } from '@/lib/store';
import { AlertCircle, Zap } from 'lucide-react';

export function AppLayout() {
  const currentCompany = useStore(state => state.currentCompany);
  
  const trialDaysLeft = currentCompany?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(currentCompany.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentCompany?.subscription_status === 'trialing' && (
          <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg z-50">
            <Zap className="h-4 w-4 fill-white animate-pulse" />
            <span>You are on a 14-day free trial. {trialDaysLeft} days remaining.</span>
            <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors text-xs border border-white/30 ml-2">
              Upgrade Now
            </button>
          </div>
        )}
        <header className="h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-bold text-slate-800">Command Center</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search anything..." className="w-64 pl-9 pr-4 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-8 w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
