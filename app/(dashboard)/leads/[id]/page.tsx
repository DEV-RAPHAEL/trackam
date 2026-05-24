"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { ArrowLeft, Mail, Phone, Building, Briefcase, Activity, Calendar, Clock, Edit3, X, MessageSquare, Send } from 'lucide-react';
import { LeadStage } from '@/types';

const getStageColor = (stage: string) => {
  switch(stage) {
    case 'New': return 'bg-blue-100 text-blue-700';
    case 'Contacted': return 'bg-purple-100 text-purple-700';
    case 'Qualified': return 'bg-amber-100 text-amber-700';
    case 'Converted': return 'bg-emerald-100 text-emerald-700';
    case 'Lost': return 'bg-slate-100 text-slate-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export default function LeadProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { leads, updateLead, leadActivities, fetchLeadActivities, addLeadActivity, convertLeadToClient } = useStore();

  const lead = (leads || []).find(l => l.id === id);
  const activities = leadActivities[id] || [];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newActivityContent, setNewActivityContent] = useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'New' as LeadStage,
    notes: '',
    last_contact_date: '',
    next_followup_date: '',
  });

  useEffect(() => {
    if (lead) {
      setEditForm({
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        company: lead.company || '',
        stage: lead.stage,
        notes: lead.notes || '',
        last_contact_date: lead.last_contact_date ? lead.last_contact_date.substring(0, 10) : '',
        next_followup_date: lead.next_followup_date ? lead.next_followup_date.substring(0, 10) : '',
      });
      fetchLeadActivities(id);
    }
  }, [lead, id]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLead(id, editForm);
    setIsEditModalOpen(false);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityContent.trim()) return;
    setIsSubmittingActivity(true);
    await addLeadActivity(id, newActivityContent);
    setNewActivityContent('');
    setIsSubmittingActivity(false);
  };

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-slate-500 dark:text-slate-400">Lead not found.</p>
        <button onClick={() => router.push('/leads')} className="text-emerald-600 dark:text-emerald-400 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/leads')} className="p-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              {lead.name}
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest", getStageColor(lead.stage))}>
                {lead.stage}
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building className="w-4 h-4" /> {lead.company}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lead.stage !== 'Converted' && lead.stage !== 'Lost' && (
            <button
              onClick={() => {
                convertLeadToClient(lead.id);
                router.push('/deals');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" /> Convert to Deal
            </button>
          )}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" /> Lead Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {lead.email}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {lead.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Added On</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {formatDate(lead.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" /> Follow-up Schedule
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Last Contacted</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {lead.last_contact_date ? formatDate(lead.last_contact_date) : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Next Follow-up</p>
                <p className={cn(
                  "text-sm font-semibold", 
                  lead.next_followup_date && new Date(lead.next_followup_date) <= new Date() ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'
                )}>
                  {lead.next_followup_date ? formatDate(lead.next_followup_date) : 'Not scheduled'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Log */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#0d0d1a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Sales Pipeline Activity</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-black/10">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-200 dark:text-slate-800" />
                  <p className="text-slate-400 dark:text-slate-500 text-sm">No activity logged yet. Add your first update below!</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-white/10 before:to-transparent">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0d0d1a] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <span className="text-xs font-bold">{activity.user_name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f0f1c] shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activity.user_name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{formatDateTime(activity.created_at)}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{activity.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0d0d1a]">
              <form onSubmit={handleAddActivity} className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={newActivityContent}
                    onChange={(e) => setNewActivityContent(e.target.value)}
                    placeholder="Log a call, meeting, or update... (e.g. 'Called on WhatsApp, booked physical meeting')"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none min-h-[60px]"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddActivity(e);
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingActivity || !newActivityContent.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 h-[60px] w-[60px] flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(9, 9, 15, 0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Edit Lead Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Company</label>
                  <input type="text" value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Last Contact Date</label>
                  <input type="date" value={editForm.last_contact_date} onChange={e => setEditForm({...editForm, last_contact_date: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Next Follow-up Date</label>
                  <input type="date" value={editForm.next_followup_date} onChange={e => setEditForm({...editForm, next_followup_date: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Current Stage</label>
                  <select value={editForm.stage} onChange={e => setEditForm({...editForm, stage: e.target.value as LeadStage})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                    <option value="New" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">New</option>
                    <option value="Contacted" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">Contacted</option>
                    <option value="Qualified" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">Qualified</option>
                    <option value="Converted" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">Converted</option>
                    <option value="Lost" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">Lost</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Notes & Background</label>
                  <textarea rows={3} value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="block w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition placeholder-slate-400 dark:placeholder-slate-600" placeholder="Any general background info..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
