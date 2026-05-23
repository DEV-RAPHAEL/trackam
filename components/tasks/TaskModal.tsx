"use client";

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { X, ClipboardList, Flag } from 'lucide-react';

const PRIORITIES: { id: TaskPriority; label: string; color: string }[] = [
  { id: 'low',    label: 'Low',    color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-200'   },
  { id: 'high',   label: 'High',   color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-50 text-red-600 border-red-200'      },
];

const STATUSES: { id: TaskStatus; label: string }[] = [
  { id: 'todo',        label: 'To Do'       },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review',      label: 'In Review'   },
  { id: 'done',        label: 'Done'        },
];

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: Props) {
  const { addTask, updateTask, currentCompany, clients, currentUser } = useStore();
  const isEdit = !!task;

  const today = new Date().toISOString().split('T')[0];
  const defaultDue = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

  const [form, setForm] = useState({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    status:      (task?.status     ?? 'todo') as TaskStatus,
    priority:    (task?.priority   ?? 'medium') as TaskPriority,
    start_date:  task?.start_date  ? task.start_date.split('T')[0] : today,
    due_date:    task?.due_date    ? task.due_date.split('T')[0]   : defaultDue,
    progress:    task?.progress    ?? 0,
    client_id:   task?.client_id   ?? '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      company_id:  currentCompany?.id ?? '',
      assigned_to: currentUser?.id ?? '',
      title:       form.title,
      description: form.description,
      status:      form.status,
      priority:    form.priority,
      start_date:  new Date(form.start_date).toISOString(),
      due_date:    new Date(form.due_date).toISOString(),
      progress:    form.progress,
      client_id:   form.client_id || undefined,
      comments:    task?.comments ?? [],
    };
    if (isEdit) {
      updateTask(task!.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{isEdit ? 'Edit Task' : 'New Task'}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Fill in the task details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              required autoFocus
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="What needs to be done?"
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Client (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Related Client</label>
            <select
              value={form.client_id}
              onChange={e => set('client_id', e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">-- None --</option>
              {(clients || []).map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Add more context..."
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date <span className="text-red-400">*</span></label>
              <input
                required
                type="date"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Progress</label>
              <span className="text-sm font-semibold text-indigo-600">{form.progress}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={5}
              value={form.progress}
              onChange={e => set('progress', Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-sm">
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
