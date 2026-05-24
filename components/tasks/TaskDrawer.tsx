"use client";

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Task } from '@/types';
import { X, Edit2, Trash2, Send, MessageSquare, Flag, Calendar, BarChart2 } from 'lucide-react';
import { formatDate, formatDateTime, cn } from '@/lib/utils';

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-50 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};
const STATUS_STYLES: Record<string, string> = {
  todo:        'bg-slate-100 text-slate-600',
  in_progress: 'bg-emerald-50 text-emerald-700',
  review:      'bg-amber-50 text-amber-700',
  done:        'bg-emerald-50 text-emerald-700',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', review: 'In Review', done: 'Done',
};

interface Props {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
}

export function TaskDrawer({ task, onClose, onEdit }: Props) {
  const { deleteTask, addTaskComment, updateTask } = useStore();
  const [comment, setComment] = useState('');

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addTaskComment(task.id, comment.trim());
    setComment('');
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const progress = task.progress ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-900/20" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full', STATUS_STYLES[task.status])}>
              {STATUS_LABELS[task.status]}
            </span>
            {task.priority && (
              <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1', PRIORITY_STYLES[task.priority])}>
                <Flag className="h-2.5 w-2.5" /> {task.priority}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h2>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-slate-500 leading-relaxed">{task.description}</p>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Start
                </p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(task.start_date)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Due
                </p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(task.due_date)}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <BarChart2 className="h-3.5 w-3.5" /> Progress
                </p>
                <span className="text-sm font-bold text-emerald-600">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Quick progress buttons */}
              <div className="flex gap-1 mt-2">
                {[0, 25, 50, 75, 100].map(p => (
                  <button
                    key={p}
                    onClick={() => updateTask(task.id, { progress: p, status: p === 100 ? 'done' : task.status })}
                    className={cn(
                      'flex-1 text-[10px] font-bold py-1 rounded-md transition-colors',
                      progress === p
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                    )}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  Comments
                </span>
                <span className="ml-auto text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                  {(task.comments ?? []).length}
                </span>
              </h3>

              <div className="space-y-3 mb-4">
                {(task.comments ?? []).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be the first to comment.</p>
                )}
                {(task.comments ?? []).map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                      {c.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">{c.user_name}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comment input — pinned to bottom */}
        <form onSubmit={submitComment} className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Leave a comment..."
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={!comment.trim()}
            className="p-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}
