"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Users, Target, Briefcase, Blocks, Infinity, CreditCard,
  Rocket, CheckCircle2, BookOpen, LifeBuoy, Layers, TrendingUp, Shield,
  Zap, Globe, Star, ChevronDown, PhoneCall, Mail, MapPin, BarChart3,
  ClipboardList, FileText, Bell, Menu, X, Sun, Moon
} from 'lucide-react';
import { useStore } from '@/lib/store';

// ─── Stats counter animation ─────────────────────────────────────────────────
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, start: () => setStarted(true) };
}

// ─── Intersection observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const [inView, setInView] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return { inView, ref: setRef };
}

// ─── Stat card with animation ─────────────────────────────────────────────────
function StatCard({ value, suffix, label, prefix = '', theme = 'dark' }: { value: number; suffix?: string; label: string; prefix?: string; theme?: 'dark' | 'light' }) {
  const { count, start } = useCounter(value);
  const { inView, ref } = useInView();

  useEffect(() => { if (inView) start(); }, [inView]);

  return (
    <div ref={ref} className="text-center">
      <div className={`text-4xl sm:text-5xl font-black tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-emerald-950'}`}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className={`mt-2 text-sm font-semibold uppercase tracking-widest transition-colors duration-500 ${theme === 'dark' ? 'text-green-300' : 'text-emerald-700'}`}>{label}</div>
    </div>
  );
}

const iconMap: Record<string, any> = {
  Users,
  Target,
  Briefcase,
  ClipboardList,
  FileText,
  BarChart3
};

export default function Landing() {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cmsData, setCmsData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setCmsData(data);
        }
      })
      .catch(err => console.error('Failed to load landing settings:', err));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('trackam-theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('trackam-theme', nextTheme);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.split(':')[0];
      const mainDomains = ['localhost', 'trackam.com.ng', 'www.trackam.com.ng'];
      if (!mainDomains.includes(hostname) && !hostname.endsWith('.railway.app')) {
        router.push('/login');
      }
    }
  }, [router]);

  const defaultFeatures = [
    { icon: Users, title: 'Client Management', desc: 'Organise all your clients, contacts, and their entire history in one place. Never lose track again.', color: 'from-blue-500 to-blue-600' },
    { icon: Target, title: 'Leads & Pipeline', desc: 'Capture every prospect, log call notes, schedule follow-ups, and convert hot leads to deals seamlessly.', color: 'from-purple-500 to-purple-600' },
    { icon: Briefcase, title: 'Deal Tracking', desc: 'Visual Kanban pipeline with real-time value tracking. Know your revenue forecast at a glance.', color: 'from-amber-500 to-orange-500' },
    { icon: ClipboardList, title: 'Task Management', desc: 'Kanban boards, Gantt charts, and task timelines. Assign to team members and track progress live.', color: 'from-emerald-500 to-green-600' },
    { icon: FileText, title: 'Invoicing & Billing', desc: 'Generate branded Naira invoices, send via email, and track payment status automatically.', color: 'from-rose-500 to-pink-600' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Revenue trends, win rates, team performance, and deal forecasts — all live, all in one screen.', color: 'from-indigo-500 to-violet-600' },
  ];

  const defaultTestimonials = [
    { name: 'Adewale Okafor', role: 'CEO, Okafor & Sons Ltd', location: 'Lagos', text: 'Before Trackam, we were managing deals in WhatsApp groups and spreadsheets. Now our entire team is coordinated. We closed 40% more deals last quarter.', rating: 5 },
    { name: 'Ngozi Eze', role: 'MD, Eze Consulting Group', location: 'Abuja', text: 'The invoicing module alone saved us 3 hours a week. Clients receive professional Naira invoices automatically. This is the best investment we made this year.', rating: 5 },
    { name: 'Ibrahim Musa', role: 'Sales Director, NorthTech Solutions', location: 'Kano', text: 'My sales team logs every WhatsApp call, every meeting, every update directly into the lead profile. No more guessing who spoke to who. Total clarity.', rating: 5 },
  ];

  const heroTitle = cmsData?.hero_title || 'The CRM that speaks your business language';
  const heroSubtitle = cmsData?.hero_subtitle || "Trackam is Nigeria's ultimate CRM and business platform. Manage clients, track deals, and send professional Naira invoices. One flat lifetime fee, unlimited team members.";
  const priceLicense = cmsData?.price_license || '₦1.2M';
  const priceMaintenance = cmsData?.price_maintenance || '+ ₦100k/year maintenance & priority support';
  const contactEmail = cmsData?.contact_email || 'hello@trackam.ng';
  const contactPhone = cmsData?.contact_phone || '+234 800 TRACKAM';
  const contactAddress = cmsData?.contact_address || 'Lagos, Nigeria 🇳🇬';

  let features = defaultFeatures;
  if (cmsData?.features) {
    try {
      const list = JSON.parse(cmsData.features);
      if (Array.isArray(list) && list.length > 0) {
        features = list.map((item: any) => ({
          icon: iconMap[item.icon] || Users,
          title: item.title,
          desc: item.desc,
          color: item.color || 'from-emerald-500 to-green-600'
        }));
      }
    } catch (e) {
      console.error('Failed to parse features CMS data:', e);
    }
  }

  let testimonials = defaultTestimonials;
  if (cmsData?.testimonials) {
    try {
      const list = JSON.parse(cmsData.testimonials);
      if (Array.isArray(list) && list.length > 0) {
        testimonials = list;
      }
    } catch (e) {
      console.error('Failed to parse testimonials CMS data:', e);
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#09090f] text-white' : 'bg-[#fafdfb] text-slate-900'} font-sans overflow-x-hidden`}>

      {/* ─── Navigation ─────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? (theme === 'dark' ? 'bg-[#09090f]/95 border-b border-white/5 shadow-lg shadow-black/10' : 'bg-[#fafdfb]/95 border-b border-emerald-100 shadow-md shadow-emerald-950/5') : 'bg-transparent'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-green-500/30">T</div>
            <span className={`font-black text-xl tracking-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Trackam</span>
            <span className="hidden sm:block text-[10px] font-bold text-green-400 uppercase tracking-widest bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">Nigeria</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-emerald-700'}`}>Features</a>
            <a href="#pricing" className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-emerald-700'}`}>Pricing</a>
            <a href="#testimonials" className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-emerald-700'}`}>Reviews</a>
            <a href="#contact" className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-emerald-700'}`}>Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`relative flex items-center justify-between w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 border overflow-hidden shadow-inner ${theme === 'dark' ? 'border-emerald-500/20 bg-slate-950/40' : 'border-emerald-600/20 bg-slate-200/40'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <Moon className={`w-3.5 h-3.5 z-10 transition-all duration-300 ${theme === 'dark' ? 'text-emerald-400 opacity-100 scale-100' : 'text-slate-400 opacity-40 scale-90'} ml-0.5`} />
              <Sun className={`w-3.5 h-3.5 z-10 transition-all duration-300 ${theme === 'light' ? 'text-amber-500 opacity-100 scale-100' : 'text-slate-400 opacity-40 scale-90'} mr-0.5`} />
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ease-out flex items-center justify-center shadow-md animate-none"
                style={{
                  left: theme === 'dark' ? '2px' : 'calc(100% - 26px)',
                  background: 'linear-gradient(to right, #059669 33%, #ffffff 33%, #ffffff 67%, #059669 67%)',
                  border: theme === 'dark' ? '1.5px solid #10b981' : '1.5px solid #059669'
                }}
              />
            </button>

            <Link href="/login" className={`text-sm font-bold transition-colors px-3 py-2 ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-emerald-800'}`}>
              Sign In
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-slate-900 text-sm font-black rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Theme Toggle & Menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className={`relative flex items-center justify-between w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 border overflow-hidden shadow-inner ${theme === 'dark' ? 'border-emerald-500/20 bg-slate-950/40' : 'border-emerald-600/20 bg-slate-200/40'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <Moon className={`w-3.5 h-3.5 z-10 transition-all duration-300 ${theme === 'dark' ? 'text-emerald-400 opacity-100' : 'text-slate-400 opacity-40'} ml-0.5`} />
              <Sun className={`w-3.5 h-3.5 z-10 transition-all duration-300 ${theme === 'light' ? 'text-amber-500 opacity-100' : 'text-slate-400 opacity-40'} mr-0.5`} />
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ease-out flex items-center justify-center shadow-md"
                style={{
                  left: theme === 'dark' ? '2px' : 'calc(100% - 26px)',
                  background: 'linear-gradient(to right, #059669 33%, #ffffff 33%, #ffffff 67%, #059669 67%)',
                  border: theme === 'dark' ? '1.5px solid #10b981' : '1.5px solid #059669'
                }}
              />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className={`p-2 transition-colors ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className={`md:hidden border-t px-4 py-6 flex flex-col gap-4 transition-colors ${theme === 'dark' ? 'bg-[#0d0d1a]/98 border-white/5' : 'bg-[#f4faf6]/98 border-emerald-100'}`}>
            <a href="#features" onClick={() => setMobileOpen(false)} className={`text-sm font-semibold py-2 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>Features</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className={`text-sm font-semibold py-2 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>Pricing</a>
            <a href="#testimonials" onClick={() => setMobileOpen(false)} className={`text-sm font-semibold py-2 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>Reviews</a>
            <Link href="/login" className={`text-sm font-bold py-2 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>Sign In</Link>
            <Link href="/register" className="w-full text-center px-5 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 text-sm font-black rounded-xl">Get Started →</Link>
          </div>
        )}
      </header>

      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 pt-24 pb-16 text-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl transition-colors duration-500 ${theme === 'dark' ? 'bg-green-500/8' : 'bg-green-500/10'}`} />
          <div className={`absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl transition-colors duration-500 ${theme === 'dark' ? 'bg-emerald-500/6' : 'bg-emerald-500/8'}`} />
          <div className={`absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-3xl transition-colors duration-500 ${theme === 'dark' ? 'bg-blue-500/6' : 'bg-blue-500/8'}`} />
          {/* Grid overlay */}
          <div className="absolute inset-0 transition-opacity duration-500" style={{
            backgroundImage: theme === 'dark' 
              ? 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)' 
              : 'linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 animate-pulse transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-green-400/10 border border-green-400/20 text-green-400' 
              : 'bg-emerald-100 border border-emerald-200 text-emerald-800'
          }`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            🇳🇬 Built for Nigerian Businesses
          </div>

          <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {heroTitle}
          </h1>

          <p className={`text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto mb-8 transition-colors ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" id="hero-cta-register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-slate-900 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-2xl shadow-green-500/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
              Start your Workspace Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/demo" id="hero-cta-demo" className={`w-full sm:w-auto px-8 py-4 border font-bold text-sm uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 ${
              theme === 'dark'
                ? 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white'
                : 'border-slate-300 hover:border-slate-400 bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-sm'
            }`}>
              View Live Demo
            </Link>
          </div>

          {/* Trust badges */}
          <div className={`flex flex-wrap items-center justify-center gap-6 text-xs font-semibold uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
            <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-green-500" /> Bank-grade Security</span>
            <span className={`hidden sm:block ${theme === 'dark' ? 'text-white/10' : 'text-slate-200'}`}>|</span>
            <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-yellow-500" /> 99.9% Uptime SLA</span>
            <span className={`hidden sm:block ${theme === 'dark' ? 'text-white/10' : 'text-slate-200'}`}>|</span>
            <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-blue-500" /> Hosted in Africa</span>
            <span className={`hidden sm:block ${theme === 'dark' ? 'text-white/10' : 'text-slate-200'}`}>|</span>
            <span className="flex items-center gap-2"><Bell className="w-3.5 h-3.5 text-purple-500" /> Setup in 5 minutes</span>
          </div>
        </div>

        {/* Scroll hint */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce transition-colors ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ─── Stats Strip ─────────────────────────────────────────────────────── */}
      <section className={`py-16 px-4 sm:px-8 border-y transition-colors duration-500 ${
        theme === 'dark' 
          ? 'border-white/5 bg-gradient-to-r from-green-600/20 via-emerald-600/10 to-green-600/20' 
          : 'border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50'
      }`}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          <StatCard value={500} suffix="+" label="Businesses Onboarded" theme={theme} />
          <StatCard value={12000} suffix="+" label="Deals Tracked" theme={theme} />
          <StatCard value={99} suffix="%" label="Customer Satisfaction" theme={theme} />
          <StatCard value={4} suffix="B+" label="₦ Revenue Managed" prefix="₦" theme={theme} />
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 transition-all ${
              theme === 'dark' 
                ? 'bg-white/5 border border-white/10 text-white/60' 
                : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
            }`}>
              <Blocks className="w-3 h-3" /> Everything You Need
            </div>
            <h2 className={`text-4xl sm:text-5xl font-black tracking-tight mb-6 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Built for how <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Nigerian businesses</span> actually work
            </h2>
            <p className={`font-medium text-lg max-w-2xl mx-auto transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'}`}>
              From Aba to Abuja, Kano to Lagos — Trackam understands the pace and complexity of doing business in Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className={`group relative p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden border ${
                theme === 'dark' 
                  ? 'bg-white/3 hover:bg-white/6 border-white/5 hover:border-white/10' 
                  : 'bg-white hover:bg-emerald-50/20 border-slate-200/80 hover:border-emerald-200 shadow-sm hover:shadow-md shadow-slate-100'
              }`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${i % 2 === 0 ? 'rgba(52,211,153,0.04)' : 'rgba(99,102,241,0.04)'} 0%, transparent 70%)` }}
                />
                <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl font-black mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                <p className={`font-medium leading-relaxed text-sm transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Unlimited section ──────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-8">
        <div className={`max-w-6xl mx-auto rounded-3xl p-8 sm:p-16 relative overflow-hidden border transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-green-950/60 via-emerald-950/60 to-slate-900/80 border-green-500/20' 
            : 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-200 shadow-lg shadow-emerald-950/5'
        }`}>
          <div className={`absolute top-0 right-0 transition-colors duration-500 ${theme === 'dark' ? 'text-green-500/5' : 'text-emerald-500/4'}`}>
            <Infinity className="w-96 h-96 -mt-12 -mr-12" />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 transition-colors ${
                theme === 'dark' ? 'bg-green-400/10 border border-green-400/20 text-green-400' : 'bg-emerald-100 border border-emerald-200 text-emerald-800'
              }`}>
                <Infinity className="w-3 h-3" /> No Limits
              </div>
              <h2 className={`text-4xl font-black tracking-tight mb-6 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                One flat price.<br />Unlimited everything.
              </h2>
              <p className={`font-medium leading-relaxed mb-8 transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'}`}>
                We don&apos;t punish you for growing. Add your entire team, thousands of clients, and as many deals as you can close. Your success doesn&apos;t increase your bill.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-slate-900 font-black rounded-xl transition-all text-sm shadow-md">
                Start Scaling Today <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Team Members', 'Clients', 'Leads', 'Deals', 'Invoices', 'Tasks', 'Activity Logs', 'Modules'].map((label) => (
                <div key={label} className={`rounded-2xl p-5 text-center border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white border-slate-200 shadow-sm shadow-slate-100'
                }`}>
                  <div className={`text-3xl font-black mb-1 transition-colors ${theme === 'dark' ? 'text-green-400' : 'text-emerald-600'}`}>∞</div>
                  <div className={`text-xs font-bold uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────────────── */}
      <section className={`py-28 px-4 sm:px-8 border-t transition-colors duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className={`text-4xl font-black tracking-tight mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Up and running in minutes</h2>
            <p className={`font-medium text-lg transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'}`}>No IT team. No lengthy onboarding. No nonsense.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className={`hidden md:block absolute top-10 left-1/3 right-1/3 h-px transition-colors ${
              theme === 'dark' ? 'bg-gradient-to-r from-transparent via-green-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-600/30 to-transparent'
            }`} />
            {[
              { icon: Users, num: '01', title: 'Register Your Workspace', desc: 'Sign up, enter your company name and subdomain. Your isolated workspace is created instantly — no shared environment.', color: 'from-green-400 to-emerald-500' },
              { icon: CreditCard, num: '02', title: 'Complete Setup Payment', desc: 'Securely pay via Paystack in Naira. One payment unlocks your full platform. No surprise upgrades later.', color: 'from-blue-400 to-indigo-500' },
              { icon: Rocket, num: '03', title: 'Go Live Immediately', desc: 'Follow the 5-minute guided onboarding. Import your clients, add your team, and start closing deals today.', color: 'from-amber-400 to-orange-500' },
            ].map((step, i) => (
              <div key={i} className={`relative p-8 border rounded-3xl text-center group transition-all ${
                theme === 'dark' 
                  ? 'bg-white/3 border-white/8 hover:border-white/15' 
                  : 'bg-white border-slate-200 hover:border-emerald-200 shadow-sm shadow-slate-100'
              }`}>
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                  theme === 'dark' ? 'bg-white/10 border border-white/20 text-white/40' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                }`}>{i + 1}</div>
                <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-lg font-black mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                <p className={`text-sm font-medium leading-relaxed transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────────────────── */}
      <section id="testimonials" className={`py-28 px-4 sm:px-8 border-t transition-colors duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 transition-colors ${
              theme === 'dark' ? 'bg-white/5 border border-white/10 text-white/60' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
            }`}>
              <Star className="w-3 h-3 text-yellow-400" /> Real Results
            </div>
            <h2 className={`text-4xl font-black tracking-tight mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Nigerian businesses are thriving</h2>
            <p className={`font-medium transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'}`}>From small shops to growing enterprises across Nigeria.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className={`p-8 border rounded-3xl transition-all ${
                theme === 'dark' 
                  ? 'bg-white/3 border-white/8 hover:border-white/15' 
                  : 'bg-white border-slate-200 hover:border-emerald-200 shadow-sm shadow-slate-100'
              }`}>
                <div className="flex gap-1 mb-6">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className={`font-medium leading-relaxed text-sm mb-8 italic transition-colors ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center font-black text-white text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className={`font-bold text-sm transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.name}</div>
                    <div className={`text-xs font-medium transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{t.role}</div>
                    <div className="text-xs text-green-600 font-bold">📍 {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className={`py-28 px-4 sm:px-8 border-t transition-colors duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className={`text-4xl font-black tracking-tight mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Transparent Pricing. No Surprises.</h2>
            <p className={`font-medium text-lg transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'}`}>One payment. One platform. Unlimited growth.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Core License */}
            <div className={`relative p-10 border-2 rounded-3xl overflow-hidden transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-green-950/80 to-emerald-950/60 border-green-500/40 shadow-2xl' 
                : 'bg-gradient-to-br from-emerald-50/50 to-white border-emerald-500/30 shadow-lg shadow-emerald-950/5'
            }`}>
              <div className="absolute top-0 right-0 bg-green-500 text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm">
                Best Value
              </div>
              <div className="mb-8">
                <h3 className={`text-2xl font-black mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-emerald-950'}`}>Lifetime Core License</h3>
                <p className={`font-medium text-sm transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Everything to run your business, forever.</p>
              </div>
              <div className="mb-2">
                <span className={`text-5xl font-black transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{priceLicense}</span>
                <span className={`font-bold ml-2 transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>one-off</span>
              </div>
              <div className={`text-sm font-bold mb-8 transition-colors ${theme === 'dark' ? 'text-green-400' : 'text-emerald-700'}`}>{priceMaintenance}</div>
              <ul className="space-y-3 mb-10">
                {['Full CRM System', 'Unlimited Team Members', 'Unlimited Clients, Leads & Deals', 'Professional Naira Invoicing', 'Access to Module Store', 'White-glove Onboarding', 'Cloud Hosting Included', '1 Year Priority Support'].map((item) => (
                  <li key={item} className={`flex items-center gap-3 text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" id="pricing-cta" className="block w-full text-center px-6 py-4 bg-green-500 hover:bg-green-400 text-slate-900 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-green-500/25">
                Initialize Your Workspace →
              </Link>
            </div>

            {/* Module Add-ons */}
            <div className={`p-10 border rounded-3xl transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-white/3 border-white/10' 
                : 'bg-white border-slate-200 shadow-sm shadow-slate-100'
            }`}>
              <div className="mb-8">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 transition-colors ${
                  theme === 'dark' ? 'bg-white/5 border border-white/10 text-white/40' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                }`}>
                  <Layers className="w-3 h-3" /> Optional Modules
                </div>
                <h3 className={`text-2xl font-black mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Expand When You&apos;re Ready</h3>
                <p className={`font-medium text-sm transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Only pay for what you actually need.</p>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'POS System', price: '₦49k', desc: 'In-store sales & inventory', color: 'from-amber-400 to-orange-500' },
                  { name: 'HR Management', price: '₦99k', desc: 'Payroll, attendance, staff records', color: 'from-blue-400 to-indigo-500' },
                  { name: 'Accounting', price: '₦79k', desc: 'Double-entry ledger & expenses', color: 'from-purple-400 to-violet-500' },
                  { name: 'Project Tracker', price: '₦39k', desc: 'Advanced project management', color: 'from-emerald-400 to-teal-500' },
                  { name: 'Support Tickets', price: '₦29k', desc: 'Customer helpdesk system', color: 'from-rose-400 to-pink-500' },
                ].map((mod) => (
                  <div key={mod.name} className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-white/3 border-white/8 hover:border-white/15' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-100 hover:border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-gradient-to-br ${mod.color} rounded-lg flex items-center justify-center`}>
                        <Blocks className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className={`text-sm font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{mod.name}</div>
                        <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{mod.desc}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-black transition-colors ${theme === 'dark' ? 'text-green-400' : 'text-emerald-700'}`}>{mod.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact Section ─────────────────────────────────────────────────── */}
      <section id="contact" className={`py-28 px-4 sm:px-8 border-t transition-colors duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-4xl font-black tracking-tight mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Talk to us before you commit</h2>
          <p className={`font-medium text-lg mb-12 transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'}`}>Our team is based in Nigeria. We understand your market.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: PhoneCall, label: 'WhatsApp Us', value: contactPhone, color: 'from-green-400 to-emerald-500' },
              { icon: Mail, label: 'Email Us', value: contactEmail, color: 'from-blue-400 to-indigo-500' },
              { icon: MapPin, label: 'Based In', value: contactAddress, color: 'from-rose-400 to-pink-500' },
            ].map((item) => (
              <div key={item.label} className={`p-8 border rounded-3xl transition-all group ${
                theme === 'dark' 
                  ? 'bg-white/3 border-white/8 hover:border-white/15' 
                  : 'bg-white border-slate-200 hover:border-emerald-200 shadow-sm shadow-slate-100'
              }`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 transition-colors ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{item.label}</div>
                <div className={`text-sm font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-8">
        <div className={`max-w-4xl mx-auto text-center rounded-3xl p-12 sm:p-20 relative overflow-hidden border transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-green-950/80 via-emerald-950/60 to-slate-900/80 border-green-500/20' 
            : 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/20 border-emerald-200 shadow-xl shadow-emerald-950/5'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-3xl" />
          <div className="relative z-10">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className={`text-4xl sm:text-5xl font-black tracking-tight mb-6 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Ready to take control of your business?
            </h2>
            <p className={`font-medium text-lg mb-10 max-w-2xl mx-auto transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'}`}>
              Join hundreds of Nigerian businesses that have left the spreadsheet era behind. Your first setup is just a click away.
            </p>
            <Link href="/register" id="final-cta" className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-slate-900 font-black text-base uppercase tracking-wider rounded-2xl transition-all shadow-2xl shadow-green-500/30 hover:scale-105 active:scale-95">
              Initialize Your Workspace <ArrowRight className="w-5 h-5" />
            </Link>
            <p className={`mt-6 text-xs font-medium transition-colors ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>No credit card required to get started. Nigerian payment via Paystack.</p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className={`py-12 px-4 sm:px-8 border-t transition-colors duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md">T</div>
            <span className={`font-black transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Trackam</span>
            <span className={`text-xs transition-colors ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>🇳🇬 Made in Nigeria</span>
          </div>
          <p className={`text-xs font-bold uppercase tracking-wider transition-colors ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
            © {new Date().getFullYear()} Trackam. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className={`text-xs font-bold transition-colors uppercase tracking-wider ${theme === 'dark' ? 'text-white/20 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}>Terms</a>
            <a href="#" className={`text-xs font-bold transition-colors uppercase tracking-wider ${theme === 'dark' ? 'text-white/20 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}>Privacy</a>
            <a href="#" className={`text-xs font-bold transition-colors uppercase tracking-wider ${theme === 'dark' ? 'text-white/20 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
