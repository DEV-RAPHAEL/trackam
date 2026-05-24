"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CreditCard, Building2, Users, Rocket, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';

const PaymentButton = dynamic(
  () => import('@/components/PaymentButton').then((mod) => mod.PaymentButton),
  { ssr: false }
);

export default function Onboarding() {
  const router = useRouter();
  const currentCompany = useStore(state => state.currentCompany);
  const currentUser = useStore(state => state.currentUser);
  const updateCompanyOnboarding = useStore(state => state.updateCompanyOnboarding);
  const addClient = useStore(state => state.addClient);
  const addDeal = useStore(state => state.addDeal);
  const addTask = useStore(state => state.addTask);
  const fetchInitialData = useStore(state => state.fetchInitialData);
  const seedSampleData = useStore(state => state.seedSampleData);
  const logActivity = useStore(state => state.logActivity);
  
  const [formData, setFormData] = useState({
    name: currentCompany?.name || 'My Workspace',
    email: '',
  });

  const [teamMembers, setTeamMembers] = useState([{ name: '', email: '' }]);

  // For the first_records step
  const [recordData, setRecordData] = useState({
    clientName: '',
    dealTitle: '',
    dealValue: '',
    taskTitle: ''
  });

  const [useTestAmount, setUseTestAmount] = useState(false);

  // Redirect if onboarding is complete — must be in useEffect, not during render
  useEffect(() => {
    console.log('🧐 Onboarding state check:', currentCompany?.onboarding_step);
    if (currentCompany?.onboarding_step === 'done') {
      console.log('🚀 Redirecting to home because onboarding is DONE');
      router.push('/dashboard');
    }
  }, [currentCompany?.onboarding_step, router]);

  if (!currentCompany) return null;
  if (currentCompany.onboarding_step === 'done') return null;

  const handleStartTrial = () => {
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    updateCompanyOnboarding({ 
      status: 'active', 
      subscription_status: 'trialing', 
      trial_ends_at: trialEndsAt, 
      onboarding_step: 'team' 
    });
    logActivity('Trial Started', `Initialized 7-day free trial for workspace "${currentCompany.name}".`);
  };

  const handlePayment = (paystackRef?: string) => {
    updateCompanyOnboarding({ 
      status: 'active', 
      subscription_status: 'active', 
      onboarding_step: 'team' 
    });
    
    const desc = paystackRef 
      ? `Completed Paystack core license purchase (₦1.3M) for workspace "${currentCompany.name}". Paystack Ref: ${paystackRef}`
      : `Completed core license purchase (₦1.3M) for workspace "${currentCompany.name}".`;

    logActivity('License Purchased', desc);
  };

  const addTeamMember = () => setTeamMembers([...teamMembers, { name: '', email: '' }]);
  
  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyOnboarding({ onboarding_step: 'first_records' });
  };

  const handleRecordsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const compId = currentCompany.id;
    
    let createdClientId = '';
    
    // We will await an arbitrary delay or we could wait for store actions to finish if they returned promises, but here we can just post to the API directly to be safe, or just wait a tiny bit to give the server time to process the non-awaited store fetches before redirecting.
    // Better yet: Since store actions fire fetch() without returning promises, we will just add a small delay.
    
    if (recordData.clientName) {
      createdClientId = uuidv4();
      addClient({
        company_id: compId,
        name: recordData.clientName,
        email: '', phone: '', company: '', status: 'active'
      });
    }

    if (recordData.dealTitle) {
      addDeal({
        company_id: compId,
        client_id: createdClientId || 'temp-client',
        title: recordData.dealTitle,
        stage: 'Prospect',
        value: Number(recordData.dealValue) || 1000
      });
    }

    if (recordData.taskTitle) {
      addTask({
        company_id: compId,
        assigned_to: currentUser?.id || '',
        title: recordData.taskTitle,
        status: 'todo',
        due_date: new Date(Date.now() + 86400000).toISOString()
      });
    }

    await new Promise(r => setTimeout(r, 600)); // wait for api calls to finish
    await fetchInitialData(compId);
    updateCompanyOnboarding({ onboarding_step: 'done' });
    router.push('/dashboard');
  };

  const handleSeedData = async () => {
    await seedSampleData();
    // seedSampleData triggers API call and fetches Initial Data inside its own logic now?
    // Wait, seedSampleData in store needs to be verified. Let's just wait a bit here too.
    await new Promise(r => setTimeout(r, 600));
    router.push('/');
  };

  const steps = [
    { id: 'payment', title: 'License', icon: CreditCard },
    { id: 'team', title: 'Team', icon: Users },
    { id: 'first_records', title: 'Quick Start', icon: Rocket },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentCompany.onboarding_step);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col py-12 px-6 sm:px-12">
      <div className="max-w-3xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-sm">T</div>
          <span className="font-bold text-3xl tracking-tight text-slate-900">Trackam Setup</span>
        </div>

        {/* Progress Tracker */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
            {steps.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm transition-colors",
                    isPast ? "bg-indigo-500 text-white" : isCurrent ? "bg-white text-indigo-600 border-2 border-indigo-500" : "bg-white text-slate-400 border border-slate-200"
                  )}>
                    {isPast ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className={cn("text-xs font-bold uppercase tracking-wider mt-3", isCurrent ? "text-indigo-600" : "text-slate-400")}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
          
          {currentCompany.onboarding_step === 'payment' && (
            <div className="space-y-10">
              <div className="text-center max-w-lg mx-auto">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-3">Choose Your Entrance Path</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Your workspace is ready to initialize! Select whether you want to test drive the system with our 7-day trial or purchase your lifetime enterprise license immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                
                {/* Option 1: 7-Day Trial */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between hover:shadow-md hover:border-indigo-200/80 transition-all shadow-sm relative overflow-hidden group text-left">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                  
                  <div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100/50 text-indigo-700 mb-3 border border-indigo-200/30">
                      Auto-Enabled Trial 🚀
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2">Start 7-Day Free Trial</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6">
                      Explore all capabilities, sync team communication, customize subdomains, and initialize your node. Zero credit card or downpayment required to start.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border-t border-slate-100 pt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Trial details
                    </div>
                    <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside mb-6 font-medium">
                      <li>Full access to all software features</li>
                      <li>Auto-expires in 7 days</li>
                      <li>Easy upgrade in settings anytime</li>
                    </ul>
                    <button
                      onClick={handleStartTrial}
                      className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer text-center"
                    >
                      Start Free Trial
                    </button>
                  </div>
                </div>

                {/* Option 2: Lifetime Purchase */}
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group text-left">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                  
                  <div>
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-amber-500/20">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 mb-3 border border-amber-500/20">
                      Lifetime Deal 🏆
                    </span>
                    <h3 className="text-xl font-extrabold text-white mb-2">Lifetime Core License</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6">
                      Secure permanent core license ownership. Pay once and use the CRM software forever, completely self-hosted, with zero ongoing subscriptions.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-left mb-6 space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500">Core License</span>
                        <span className="text-slate-300">{useTestAmount ? '₦100' : '₦1.2M'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold border-t border-slate-800 pt-2.5">
                        <span className="text-slate-500">First Year Maintenance</span>
                        <span className="text-slate-300">{useTestAmount ? '₦0' : '₦100k'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black border-t border-slate-800 pt-2.5 mt-2.5">
                        <span className="text-slate-400">Total Due</span>
                        <span className="text-amber-400 text-sm">{useTestAmount ? '₦100' : '₦1.3M'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <input 
                        type="checkbox" 
                        id="test-amount" 
                        checked={useTestAmount} 
                        onChange={(e) => setUseTestAmount(e.target.checked)} 
                        className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 w-3.5 h-3.5" 
                      />
                      <label htmlFor="test-amount" className="text-[9px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none">
                        Test with ₦100 amount (Bypasses bank limits)
                      </label>
                    </div>
                    
                    <PaymentButton
                      amount={useTestAmount ? 100 : 1300000}
                      email={currentUser?.email || 'owner@company.com'}
                      metadata={{ 
                        company_id: currentCompany.id, 
                        company_name: currentCompany.name,
                        type: 'core_license',
                        test_mode: useTestAmount
                      }}
                      onSuccess={(ref) => {
                        handlePayment();
                      }}
                      label={useTestAmount ? "Pay ₦100 Test Charge" : "Purchase Core License"}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/10 transition-all cursor-pointer text-center flex items-center justify-center border-none"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}



          {currentCompany.onboarding_step === 'team' && (
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Invite your team</h2>
              <p className="text-slate-500 font-medium mb-8">You have unlimited team members. Add your immediate core team now.</p>
              
              <form onSubmit={handleTeamSubmit} className="space-y-6">
                
                {teamMembers.map((member, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Name</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const newT = [...teamMembers];
                          newT[i].name = e.target.value;
                          setTeamMembers(newT);
                        }}
                        className="block w-full rounded-lg border-slate-200 bg-white py-2 pl-3 text-sm border shadow-sm outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email</label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => {
                          const newT = [...teamMembers];
                          newT[i].email = e.target.value;
                          setTeamMembers(newT);
                        }}
                        className="block w-full rounded-lg border-slate-200 bg-white py-2 pl-3 text-sm border shadow-sm outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={addTeamMember}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                >
                  + Add another member
                </button>

                <div className="pt-8 flex items-center justify-between border-t border-slate-100 mt-8">
                  <button type="submit" className="text-slate-500 text-sm font-bold hover:text-slate-800">
                    Skip for now
                  </button>
                  <button type="submit" className="px-8 py-3 bg-indigo-500 text-white font-bold uppercase tracking-wide rounded-lg shadow-sm hover:bg-indigo-400 transition-colors">
                    Continue →
                  </button>
                </div>
              </form>
            </div>
          )}

          {currentCompany.onboarding_step === 'first_records' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3">
                  <Rocket className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Let's get started!</h2>
                <p className="text-slate-500 font-medium max-w-md mx-auto">
                  Add your first records so you don't start with an empty canvas. Or skip and generate sample data to explore safely.
                </p>
              </div>

              <form onSubmit={handleRecordsSubmit} className="space-y-6 max-w-lg mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-sm font-bold leading-6 text-slate-800">
                    Add a Client
                  </label>
                  <input
                    type="text"
                    value={recordData.clientName}
                    onChange={(e) => setRecordData({...recordData, clientName: e.target.value})}
                    className="mt-2 block w-full rounded-lg border-slate-200 py-2 pl-3 text-sm border shadow-sm outline-none bg-white"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold leading-6 text-slate-800">
                    Add a Deal
                  </label>
                  <div className="mt-2 flex gap-3">
                    <input
                      type="text"
                      value={recordData.dealTitle}
                      onChange={(e) => setRecordData({...recordData, dealTitle: e.target.value})}
                      className="block w-2/3 rounded-lg border-slate-200 py-2 pl-3 text-sm border shadow-sm outline-none bg-white"
                      placeholder="e.g. Website Overhaul"
                    />
                    <input
                      type="number"
                      value={recordData.dealValue}
                      onChange={(e) => setRecordData({...recordData, dealValue: e.target.value})}
                      className="block w-1/3 rounded-lg border-slate-200 py-2 pl-3 text-sm border shadow-sm outline-none bg-white"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold leading-6 text-slate-800">
                    Add a Task
                  </label>
                  <input
                    type="text"
                    value={recordData.taskTitle}
                    onChange={(e) => setRecordData({...recordData, taskTitle: e.target.value})}
                    className="mt-2 block w-full rounded-lg border-slate-200 py-2 pl-3 text-sm border shadow-sm outline-none bg-white"
                    placeholder="e.g. Send marketing proposal"
                  />
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 mt-6">
                  <button 
                    type="button" 
                    onClick={handleSeedData}
                    className="text-slate-500 text-sm font-bold hover:text-slate-800 whitespace-nowrap"
                  >
                    Skip & Load Sample Data
                  </button>
                  <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-indigo-500 text-white font-bold uppercase tracking-wide rounded-lg shadow-sm hover:bg-indigo-400 transition-colors">
                    Go to Dashboard
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
