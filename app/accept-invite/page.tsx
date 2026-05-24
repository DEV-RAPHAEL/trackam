"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ShieldCheck, Loader2 } from 'lucide-react';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { verifyInvite, acceptInvite } = useStore();
  const router = useRouter();

  const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid'>('verifying');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      verifyInvite(token).then((success) => {
        if (success) {
          setStatus('valid');
        } else {
          setStatus('invalid');
          setTimeout(() => router.push('/login'), 2000);
        }
      });
    } else {
      router.push('/login');
    }
  }, [token, verifyInvite, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const success = await acceptInvite(token, password);
    if (success) {
      router.push('/dashboard');
    } else {
      alert("Failed to set password. Link may have expired.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
        </div>
        
        {status === 'verifying' && (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Verifying Invitation</h1>
              <p className="text-slate-500">Please wait while we secure your workspace access...</p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          </>
        )}

        {status === 'invalid' && (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
            <p className="text-slate-500">This invite link has expired or is invalid. Redirecting to login...</p>
          </div>
        )}

        {status === 'valid' && (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Welcome to the team</h1>
              <p className="text-slate-500">Set a secure password to activate your account and join the workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate Account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvite() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Loading Invitation</h1>
            <p className="text-slate-500">Please wait while we secure your workspace...</p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
