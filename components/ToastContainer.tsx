"use client";

import React from 'react';
import { useStore } from '@/lib/store';
import { CheckCircle, AlertCircle, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { notifications, removeToast } = useStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border min-w-[280px] animate-in slide-in-from-right-full duration-300",
            toast.type === 'success' && "bg-emerald-50 border-emerald-100 text-emerald-800",
            toast.type === 'error' && "bg-red-50 border-red-100 text-red-800",
            toast.type === 'info' && "bg-emerald-50 border-emerald-100 text-emerald-800",
            toast.type === 'loading' && "bg-white border-slate-200 text-slate-800"
          )}
        >
          <div className="shrink-0">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-emerald-500" />}
            {toast.type === 'loading' && <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />}
          </div>
          <p className="text-sm font-semibold flex-1">{toast.message}</p>
          {toast.type !== 'loading' && (
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 hover:bg-black/5 rounded-md transition-colors"
            >
              <X className="h-4 w-4 opacity-50" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
