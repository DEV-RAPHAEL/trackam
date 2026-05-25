"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { useStore } from '@/lib/store';
import { Zap, Menu, X, Loader2, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QuickGuide } from '@/components/QuickGuide';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentCompany = useStore(state => state.currentCompany);
  const currentUser = useStore(state => state.currentUser);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const loginWithToken = useStore(state => state.loginWithToken);
  const logout = useStore(state => state.logout);
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
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
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#09090f]' : 'bg-slate-50'}`}>
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }
  
  const trialDaysLeft = currentCompany?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(currentCompany.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${theme === 'dark' ? 'dark bg-[#09090f] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Global Guided Walkthrough */}
      <QuickGuide />
      
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

      <main className="flex-1 flex flex-col md:pl-[220px] overflow-hidden w-full relative z-0">
        {currentCompany?.subscription_status === 'trialing' && (
          <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg z-20">
            <Zap className="h-4 w-4 fill-white animate-pulse shrink-0" />
            <span className="truncate">14-day free trial. {trialDaysLeft} days remaining.</span>
            <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors text-xs border border-white/30 shrink-0">
              Upgrade
            </button>
          </div>
        )}
        {currentUser && !currentUser.email_verified && (
          <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-md z-20 border-b border-amber-600/20">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-base">⚠️</span>
              <span className="truncate">Your email address is unverified. Please verify your email to unlock all features (like sending invoices).</span>
            </div>
            <button
              onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(currentUser.email)}&type=email_verify`)}
              className="bg-white text-amber-800 hover:bg-slate-50 font-bold px-3 py-1 rounded-lg transition-colors text-xs shrink-0 shadow-sm whitespace-nowrap"
            >
              Verify Email Now
            </button>
          </div>
        )}
        <header className={`h-[64px] border-b flex items-center justify-between px-4 sm:px-8 shrink-0 relative z-10 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0d0d1a] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button 
              className={`md:hidden p-2 -ml-2 rounded-md transition-colors ${theme === 'dark' ? 'text-white/60 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className={`text-lg font-bold hidden sm:block transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Command Center</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative flex items-center justify-between w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 border overflow-hidden shadow-inner ${theme === 'dark' ? 'border-emerald-500/20 bg-slate-950/40' : 'border-emerald-600/20 bg-slate-200/40'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <Moon className={`w-3.5 h-3.5 z-10 transition-all duration-300 ${theme === 'dark' ? 'text-emerald-400 opacity-100 scale-100' : 'text-slate-400 opacity-40 scale-90'} ml-0.5`} />
              <Sun className={`w-3.5 h-3.5 z-10 transition-all duration-300 ${theme === 'light' ? 'text-amber-500 opacity-100 scale-100' : 'text-slate-400 opacity-40 scale-90'} mr-0.5`} />
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ease-out flex items-center justify-center shadow-md"
                style={{
                  left: theme === 'dark' ? '2px' : 'calc(100% - 26px)',
                  background: 'linear-gradient(to right, #059669 33%, #ffffff 33%, #ffffff 67%, #059669 67%)',
                  border: theme === 'dark' ? '1.5px solid #10b981' : '1.5px solid #059669'
                }}
              />
            </button>
            
            <div className="relative hidden xs:block">
              <input type="text" placeholder="Search..." className={`w-40 sm:w-64 pl-9 pr-4 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-slate-100 border-slate-200 text-slate-900'}`} />
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
