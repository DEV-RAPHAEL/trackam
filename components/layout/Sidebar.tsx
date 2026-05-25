"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Briefcase, 
  CheckSquare, 
  Receipt, 
  Blocks, 
  Settings,
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'user'] },
  { name: 'Clients', href: '/clients', icon: Users, roles: ['owner', 'admin', 'user'] },
  { name: 'Leads', href: '/leads', icon: Target, roles: ['owner', 'admin', 'user'] },
  { name: 'Deals', href: '/deals', icon: Briefcase, roles: ['owner', 'admin', 'user'] },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['owner', 'admin', 'user'] },
  { name: 'Invoices', href: '/invoices', icon: Receipt, roles: ['owner', 'admin', 'user'] },
  { name: 'Modules', href: '/modules', icon: Blocks, roles: ['owner', 'admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['owner', 'admin'] },
];

export function Sidebar() {
  const currentCompany = useStore(state => state.currentCompany);
  const currentUser = useStore(state => state.currentUser);
  const logout = useStore(state => state.logout);
  const theme = useStore(state => state.theme);
  const pathname = usePathname();

  return (
    <nav className={`w-full md:w-[220px] h-full flex flex-col shrink-0 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#09090f] border-r border-white/5' : 'bg-white border-r border-slate-200'}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center font-bold text-white shadow-lg">
          T
        </div>
        <span className={`font-bold text-xl tracking-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Trackam</span>
      </div>
      
      <div className="flex-1 px-4 space-y-1 overflow-y-auto mt-2">
        {navigation.filter(item => !currentUser || item.roles.includes(currentUser.role)).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={isActive ? { 
                backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.13)' : 'rgba(16, 185, 129, 0.1)',
                borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.27)' : 'rgba(16, 185, 129, 0.2)',
                color: theme === 'dark' ? '#34d399' : '#059669'
              } : {}}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-transparent',
                !isActive && (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')
              )}
            >
              <item.icon
                className="h-4 w-4 shrink-0 transition-colors"
                style={isActive ? { color: theme === 'dark' ? '#34d399' : '#059669' } : {}}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className={`p-4 mt-auto border-t transition-colors duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('start-trackam-tour'))}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 border border-transparent mb-3 text-left hover:scale-[1.01] active:scale-[0.99] cursor-pointer',
            theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <svg className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quick Guide
        </button>
        <div className={`border rounded-lg p-3 mb-4 transition-colors ${theme === 'dark' ? 'bg-emerald-950/40 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>Expansion</span>
            <Blocks className={`w-3 h-3 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-emerald-200' : 'text-emerald-800/70'}`}>Unlock Accounting & POS modules</p>
          <Link 
            href="/modules" 
            className="block text-center w-full py-1.5 hover:opacity-90 text-white bg-gradient-to-r from-emerald-500 to-green-600 text-[10px] font-bold uppercase rounded transition-all shadow-sm"
          >
            View Modules
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${theme === 'dark' ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-200 border border-slate-300 text-slate-700'}`}>
              {currentUser?.name?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name || 'Admin'}</p>
                <span className={cn(
                  "text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter",
                  currentUser?.role === 'owner' ? "bg-amber-400 text-amber-900" :
                  currentUser?.role === 'admin' ? "bg-emerald-400 text-emerald-900" :
                  (theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700")
                )}>
                  {currentUser?.role || 'User'}
                </span>
              </div>
              <p className={`text-[10px] truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{currentCompany?.name || 'Company Name'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className={`p-1.5 rounded-md transition-colors ml-2 ${theme === 'dark' ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`} 
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
