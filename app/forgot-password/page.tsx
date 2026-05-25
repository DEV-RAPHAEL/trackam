"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, Loader2, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

type Step = 'email' | 'otp' | 'reset' | 'done';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Allow deep-link into reset step from verify-otp page
  const initialStep = (searchParams.get('step') as Step) || 'email';
  const initialEmail = searchParams.get('email') || '';
  const initialCode = searchParams.get('code') || '';

  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // ── Step 1: Request OTP ────────────────────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Always 200 (anti-enumeration) — move to OTP step regardless
      setStep('otp');
      setMessage('A 6-digit code has been sent if that email exists in our system.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, type: 'password_reset' }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setStep('reset');
      } else {
        setError(data.error || 'Invalid or expired code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Set New Password ───────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep('done');
      } else {
        setError(data.error || 'Failed to reset password. Please start again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: 'bg-slate-700', width: 'w-0' };
    if (pwd.length < 8) return { label: 'Too short', color: 'bg-red-500', width: 'w-1/4' };
    if (/^[a-z]+$/.test(pwd)) return { label: 'Weak', color: 'bg-orange-500', width: 'w-1/3' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
    return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/3' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step === s ? 'bg-violet-600 text-white ring-2 ring-violet-400/30 ring-offset-2 ring-offset-slate-950' :
                  (['email', 'otp', 'reset'] as Step[]).indexOf(step) > i ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}
              >
                {(['email', 'otp', 'reset'] as Step[]).indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`w-12 h-0.5 transition-all ${(['email', 'otp', 'reset'] as Step[]).indexOf(step) > i ? 'bg-emerald-600' : 'bg-slate-800'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
          {/* ── Done State ───────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Password Reset! 🎉</h1>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="block w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-center transition-colors"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {/* ── Step 1: Email ─────────────────────────────────────────── */}
          {step === 'email' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-violet-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Forgot Password?</h1>
              <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </p>
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label htmlFor="fp-email" className="block text-sm font-semibold text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="fp-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-sm"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Sending…' : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP Entry ─────────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-amber-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Enter Reset Code</h1>
              {message && <p className="text-emerald-400 text-sm text-center mb-4 font-medium">{message}</p>}
              <p className="text-slate-400 text-center text-sm mb-8">
                Check your inbox for <span className="text-violet-400 font-semibold">{email}</span>
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label htmlFor="fp-otp" className="block text-sm font-semibold text-slate-300 mb-2">
                    6-Digit Code
                  </label>
                  <input
                    id="fp-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-center text-2xl tracking-[1rem] font-bold placeholder-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                    placeholder="——————"
                    autoFocus
                  />
                </div>

                {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Verifying…' : 'Verify Code'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Email
                </button>
              </form>
            </>
          )}

          {/* ── Step 3: New Password ──────────────────────────────────── */}
          {step === 'reset' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Set New Password</h1>
              <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
                Choose a strong password for your Trackam account.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="fp-new-pass" className="block text-sm font-semibold text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="fp-new-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      className="w-full pr-11 pl-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-sm"
                      placeholder="Min. 8 characters"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
                      </div>
                      <p className={`text-xs mt-1 font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="fp-confirm-pass" className="block text-sm font-semibold text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="fp-confirm-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 focus:ring-2 outline-none transition-all text-sm
                      ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' :
                        confirmPassword && confirmPassword === newPassword ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20' :
                        'border-slate-700 focus:border-violet-500 focus:ring-violet-500/20'}`}
                    placeholder="Repeat your password"
                  />
                </div>

                {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
                  className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>

        {step !== 'done' && (
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
              ← Back to Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
