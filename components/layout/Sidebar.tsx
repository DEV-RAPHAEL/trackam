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
  const pathname = usePathname();

  return (
    <nav className="w-full md:w-[220px] h-full bg-slate-900 flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
          T
        </div>
        <span className="text-white font-bold text-xl tracking-tight">Trackam</span>
      </div>
      
      <div className="flex-1 px-4 space-y-1 overflow-y-auto mt-2">
        {navigation.filter(item => !currentUser || item.roles.includes(currentUser.role)).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={isActive ? { 
                backgroundColor: 'rgba(79, 70, 229, 0.13)',
                borderColor: 'rgba(79, 70, 229, 0.27)',
                color: '#818cf8'
              } : {}}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-transparent',
                !isActive && 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon
                className="h-4 w-4 shrink-0 transition-colors"
                style={isActive ? { color: '#818cf8' } : {}}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="bg-indigo-900/40 border border-indigo-700/50 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Expansion</span>
            <Blocks className="w-3 h-3 text-indigo-400" />
          </div>
          <p className="text-xs text-indigo-200 mb-2">Unlock Accounting & POS modules</p>
          <Link 
            href="/modules" 
            style={{ backgroundColor: '#4f46e5' }}
            className="block text-center w-full py-1.5 hover:opacity-90 text-white text-[10px] font-bold uppercase rounded transition-all shadow-sm"
          >
            View Modules
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {currentUser?.name?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'Admin'}</p>
                <span className={cn(
                  "text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter",
                  currentUser?.role === 'owner' ? "bg-amber-400 text-amber-900" :
                  currentUser?.role === 'admin' ? "bg-indigo-400 text-indigo-900" :
                  "bg-slate-600 text-slate-200"
                )}>
                  {currentUser?.role || 'User'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{currentCompany?.name || 'Company Name'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-colors ml-2" 
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
