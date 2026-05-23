"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { useStore } from '@/lib/store';
import { Zap, Menu, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentCompany = useStore(state => state.currentCompany);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const loginWithToken = useStore(state => state.loginWithToken);
  const logout = useStore(state => state.logout);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // 1. Root Domain CRM Isolation Guard
  useEffect(() => {
    const hostname = window.location.hostname;
    const cleanHostname = hostname.split(':')[0];
    const mainDomains = ['localhost', 'trackam.ng', 'www.trackam.ng'];
    
    if (mainDomains.includes(cleanHostname)) {
      window.location.href = '/';
    }
  }, []);

  // 2. Multi-Tenant Auto-Login from Subdomain query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      loginWithToken(tokenParam).then(success => {
        if (success) {
          // Clean the token parameter to keep URL pristine
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
        setIsCheckingToken(false);
      });
    } else {
      setIsCheckingToken(false);
    }
  }, [loginWithToken]);

  // 3. Authentication Redirect Guard
  useEffect(() => {
    if (!isCheckingToken && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isCheckingToken, router]);

  // 4. Strict Subdomain Matching Guard (Prevent Cross-Tenant Leakage)
  useEffect(() => {
    if (isCheckingToken || !isAuthenticated || !currentCompany) return;

    const hostname = window.location.hostname;
    const cleanHostname = hostname.split(':')[0];
    const mainDomains = ['localhost', 'trackam.ng', 'www.trackam.ng'];

    if (!mainDomains.includes(cleanHostname)) {
      const currentHostSubdomain = cleanHostname.split('.')[0];
      const companySubdomain = currentCompany.subdomain;

      if (companySubdomain && companySubdomain !== currentHostSubdomain) {
        // Mismatched session: log out and redirect to current subdomain's login page
        logout();
        router.push('/login');
      }
    }
  }, [isAuthenticated, currentCompany, isCheckingToken, logout, router]);

  // 5. Onboarding Redirect Guard
  useEffect(() => {
    if (isCheckingToken || !isAuthenticated || !currentCompany) return;

    if (currentCompany.onboarding_step && currentCompany.onboarding_step !== 'done') {
      router.push('/onboarding');
    }
  }, [isAuthenticated, currentCompany, isCheckingToken, router]);

  const needsOnboarding = currentCompany?.onboarding_step && currentCompany.onboarding_step !== 'done';

  if (isCheckingToken || !isAuthenticated || needsOnboarding) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }
  
  const trialDaysLeft = currentCompany?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(currentCompany.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-[220px] md:flex-col md:fixed md:inset-y-0 z-10">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="relative z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative flex w-full max-w-xs flex-1 transform transition-all ease-in-out duration-300">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col md:pl-[220px] overflow-hidden w-full">
        {currentCompany?.subscription_status === 'trialing' && (
          <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg z-20">
            <Zap className="h-4 w-4 fill-white animate-pulse shrink-0" />
            <span className="truncate">14-day free trial. {trialDaysLeft} days remaining.</span>
            <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors text-xs border border-white/30 shrink-0">
              Upgrade
            </button>
          </div>
        )}
        <header className="h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Command Center</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden xs:block">
              <input type="text" placeholder="Search..." className="w-40 sm:w-64 pl-9 pr-4 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <NotificationsDropdown />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto w-full relative z-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
