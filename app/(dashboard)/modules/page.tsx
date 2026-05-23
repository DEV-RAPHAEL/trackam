"use client";

import React from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, cn } from '@/lib/utils';
import { Blocks, CheckCircle2, Lock } from 'lucide-react';

export default function ModulesPage() {
  const { modules, unlockModule } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Modules</h1>
        <p className="mt-1 text-sm text-slate-500">Expand your business operating system as you grow.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(modules || []).map((module) => (
          <div 
            key={module.id} 
            className={cn(
              "bg-white overflow-hidden rounded-xl border shadow-sm flex flex-col transition-all",
              module.status === 'active' ? 'border-indigo-200 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'
            )}
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  module.status === 'active' ? "bg-indigo-100/50 text-indigo-600" : "bg-slate-100 text-slate-500"
                )}>
                  <Blocks className="h-6 w-6" />
                </div>
                {module.status === 'active' && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide text-indigo-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                  </span>
                )}
                {module.status === 'locked' && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide text-slate-500">
                    <Lock className="mr-1 h-3 w-3" /> Locked
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900">{module.name}</h3>
              <p className="mt-2 text-sm text-slate-500 flex-1">{module.description}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(module.price)}<span className="text-xs font-medium text-slate-500">/mo</span>
                </div>
                
                {module.status === 'active' ? (
                  <button disabled className="px-4 py-2 bg-slate-50 text-slate-400 rounded-md text-xs font-bold uppercase tracking-wide border border-slate-200">
                    Installed
                  </button>
                ) : (
                  <button 
                    onClick={() => unlockModule(module.id)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-md text-xs font-bold uppercase tracking-wide hover:bg-indigo-400 transition-colors shadow-sm"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
