"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { X, ChevronRight, ChevronLeft, Award, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  target: string;
  title: string;
  content: string;
  route: string;
}

const tourSteps: Step[] = [
  {
    target: 'body',
    title: 'Welcome to Trackam! 🎉',
    content: "We're thrilled to have you here. This quick interactive tour will guide you through completing your setup, configuring branding, and navigating the Command Center in under 60 seconds.",
    route: '/dashboard'
  },
  {
    target: 'nav a[href="/settings"]',
    title: 'Profile, Branding & Bank Setup ⚙️',
    content: "Configure your company logo, brand color, and Naira bank details here. Your invoices will automatically use these settings to display payment instructions and custom branding.",
    route: '/settings'
  },
  {
    target: 'nav a[href="/clients"]',
    title: 'Manage Your Client Database 👥',
    content: "Store contact details, track outstanding balances, and monitor financial health (Lifetime Value) for every customer in one unified view.",
    route: '/clients'
  },
  {
    target: 'nav a[href="/leads"]',
    title: 'Sales Pipelines & Lead Automated Follow-ups 🎯',
    content: "Capture incoming leads, log call/meeting activity, and schedule automated follow-ups so you never lose track of a prospect.",
    route: '/leads'
  },
  {
    target: 'nav a[href="/deals"]',
    title: 'Deal Revenue Forecasts 💼',
    content: "Use our visual drag-and-drop Kanban deals board to manage contracts, assign probabilities, and forecast your upcoming cash flows.",
    route: '/deals'
  },
  {
    target: 'nav a[href="/tasks"]',
    title: 'Keep Your Team Accountable 📋',
    content: "Assign tasks, set priorities, and track progress using our list, board, and Gantt charts to coordinate your workflows.",
    route: '/tasks'
  },
  {
    target: 'nav a[href="/invoices"]',
    title: 'Naira Invoicing & Billings 💸',
    content: "Generate professional Naira invoices in minutes, send them directly to clients, set up recurring monthly retainers, and track automated payment receipts.",
    route: '/invoices'
  },
  {
    target: 'body',
    title: "You're All Set! 🚀",
    content: "That's it! You've mastered the basics. You can re-launch this guided tour at any time by clicking 'Quick Guide' at the bottom of the sidebar. Happy trackin'!",
    route: '/dashboard'
  }
];

export function QuickGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useStore(state => state.theme);
  
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetCoords, setTargetCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
  // Start tour handler
  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    const firstStep = tourSteps[0];
    if (pathname !== firstStep.route) {
      router.push(firstStep.route);
    }
  };

  // Listen for global custom event
  useEffect(() => {
    const handleStartTourEvent = () => startTour();
    window.addEventListener('start-trackam-tour', handleStartTourEvent);
    
    // Auto-trigger on first-time login
    const tourCompleted = localStorage.getItem('trackam_tour_completed');
    if (!tourCompleted) {
      // Small timeout to let initial page render peacefully
      const timer = setTimeout(() => startTour(), 2000);
      return () => clearTimeout(timer);
    }
    
    return () => {
      window.removeEventListener('start-trackam-tour', handleStartTourEvent);
    };
  }, [pathname]);

  // Monitor DOM elements coordinates
  useEffect(() => {
    if (!isActive) return;
    
    const step = tourSteps[currentStep];
    if (step.target === 'body') {
      setTargetCoords(null);
      return;
    }

    const updateCoords = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      } else {
        setTargetCoords(null);
      }
    };

    // Retry checking because routes take some time to render
    updateCoords();
    const interval = setInterval(updateCoords, 200);
    window.addEventListener('resize', updateCoords);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isActive, currentStep, pathname]);

  const handleNext = () => {
    if (currentStep >= tourSteps.length - 1) {
      handleComplete();
      return;
    }
    const nextStep = tourSteps[currentStep + 1];
    setCurrentStep(prev => prev + 1);
    if (nextStep.route !== pathname) {
      router.push(nextStep.route);
    }
  };

  const handleBack = () => {
    if (currentStep <= 0) return;
    const prevStep = tourSteps[currentStep - 1];
    setCurrentStep(prev => prev - 1);
    if (prevStep.route !== pathname) {
      router.push(prevStep.route);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem('trackam_tour_completed', 'true');
    router.push('/dashboard');
  };

  const handleSkip = () => {
    setIsActive(false);
    localStorage.setItem('trackam_tour_completed', 'true');
  };

  if (!isActive) return null;

  const current = tourSteps[currentStep];

  // Determine popover position
  const isCentered = !targetCoords;
  
  let popoverStyle: React.CSSProperties = {};
  if (!isCentered && targetCoords) {
    const isSidebarItem = current.target.includes('nav a');
    if (isSidebarItem) {
      // Place to the right of the sidebar item
      popoverStyle = {
        top: `${targetCoords.top}px`,
        left: `${targetCoords.left + targetCoords.width + 16}px`,
      };
    } else {
      // Place below element
      popoverStyle = {
        top: `${targetCoords.top + targetCoords.height + 16}px`,
        left: `${targetCoords.left}px`,
      };
    }
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none font-sans select-none">
      {/* Dim backdrop */}
      <div 
        className="absolute inset-0 bg-[#09090f]/50 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Highlighter ring */}
      {targetCoords && (
        <div 
          className="absolute border-2 border-emerald-500 rounded-lg shadow-[0_0_15px_#10b981] animate-pulse z-50 transition-all duration-300"
          style={{
            top: `${targetCoords.top - 4}px`,
            left: `${targetCoords.left - 4}px`,
            width: `${targetCoords.width + 8}px`,
            height: `${targetCoords.height + 8}px`,
          }}
        />
      )}

      {/* Tour popover */}
      <div 
        className={cn(
          "absolute pointer-events-auto bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-4 transition-all duration-300 z-50",
          isCentered 
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md" 
            : "w-80"
        )}
        style={popoverStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <HelpCircle className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{current.title}</h3>
          </div>
          <button 
            onClick={handleSkip}
            className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 transition-colors"
            title="Skip Tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">
          {current.content}
        </p>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Step {currentStep + 1} of {tourSteps.length}
          </span>
          <div className="flex gap-2 shrink-0">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < tourSteps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
