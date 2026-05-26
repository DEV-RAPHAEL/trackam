"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Shield, Loader2, RotateCcw, CheckCircle2 } from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = (searchParams.get('type') || 'login_otp') as 'login_otp' | 'email_verify' | 'password_reset';

  const verifyLoginOtp = useStore(state => state.verifyLoginOtp);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const currentUser = useStore(state => state.currentUser);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Redirect after successful auth
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'superadmin') {
        router.push('/superadmin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, currentUser, router]);



  const focusNext = (index: number) => {
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const focusPrev = (index: number) => {
    if (index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of full code
    if (value.length === OTP_LENGTH) {
      const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
      if (pasted.length === OTP_LENGTH) {
        const newDigits = pasted.split('');
        setDigits(newDigits);
        inputRefs.current[OTP_LENGTH - 1]?.focus();
        return;
      }
    }

    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    if (digit) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index]) {
        focusPrev(index);
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft') {
      focusPrev(index);
    } else if (e.key === 'ArrowRight') {
      focusNext(index);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (type === 'login_otp') {
        await verifyLoginOtp(email, code);
        // If authenticated, the useEffect will redirect
        // If not, there was an error (shown via toast from store)
      } else if (type === 'password_reset') {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, type }),
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          router.push(`/forgot-password?step=reset&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
        } else {
          setError(data.error || 'Invalid or expired code.');
        }
      } else if (type === 'email_verify') {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, type }),
        });
        const data = await res.json();
        if (res.ok) {
          useStore.setState({
            currentUser: data.user,
            token: data.token || useStore.getState().token,
            isAuthenticated: true,
            currentCompany: data.company || useStore.getState().currentCompany
          });
          setSuccess(true);
        } else {
          setError(data.error || 'Invalid or expired code.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when all digits filled
  useEffect(() => {
    if (digits.every(d => d !== '') && !isLoading) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      if (type === 'password_reset') {
        await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } else {
        await fetch('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, type }),
        });
      }
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      setError('');
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const typeLabels = {
    login_otp: { title: 'Verify Your Login', desc: 'Enter the 6-digit code sent to your email to complete sign in.' },
    email_verify: { title: 'Verify Your Email', desc: 'Enter the 6-digit code from your welcome email to activate your account.' },
    password_reset: { title: 'Enter Reset Code', desc: 'Enter the 6-digit code sent to your email to reset your password.' },
  };

  const { title, desc } = typeLabels[type] || typeLabels.login_otp;

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Email Verified! 🎉</h1>
          <p className="text-slate-400 mb-8">Your account is now fully verified. You can now use all features of Trackam.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-violet-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">{title}</h1>
          <p className="text-slate-400 text-center text-sm mb-2 leading-relaxed">{desc}</p>
          <p className="text-violet-400 text-center text-sm font-semibold mb-8 truncate">{email}</p>

          <form onSubmit={handleSubmit}>
            {/* OTP Digit Inputs */}
            <div className="flex gap-3 justify-center mb-6" role="group" aria-label="One-time password input">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  id={`otp-digit-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={digit}
                  onChange={e => handleDigitChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onFocus={e => e.target.select()}
                  autoFocus={index === 0}
                  className={`
                    w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
                    bg-slate-800 text-white caret-transparent
                    ${digit ? 'border-violet-500 bg-violet-950/30' : 'border-slate-700'}
                    ${error ? 'border-red-500' : ''}
                    focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20
                  `}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || digits.some(d => !d)}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Verifying…' : 'Verify Code'}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="text-sm font-bold text-violet-400 hover:text-violet-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 mx-auto"
            >
              {isResending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Security note */}
          <p className="mt-6 text-center text-xs text-slate-600 leading-relaxed">
            🔒 This code expires in 10 minutes.<br />Never share it with anyone, including Trackam support.
          </p>
        </div>

        {/* Back link */}
        <p className="mt-4 text-center text-sm text-slate-500">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
            ← Go back
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
