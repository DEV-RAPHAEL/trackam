"use client";

import React from 'react';
import { Task } from '@/types';
import { Calendar, Flag, MessageSquare, BarChart2, Edit2 } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-400', medium: 'bg-blue-500', high: 'bg-orange-500', urgent: 'bg-red-500',
};
const PRIORITY_LABEL: Record<string, string> = {
  low: 'text-slate-500', medium: 'text-blue-600', high: 'text-orange-600', urgent: 'text-red-600',
};

interface Props {
  task: Task;
  onOpen: (t: Task) => void;
  onEdit: (t: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onOpen, onEdit, compact }: Props) {
  const progress = task.progress ?? 0;
  const commentCount = (task.comments ?? []).length;
  const overdue = task.due_date ? new Date(task.due_date) < new Date() && task.status !== 'done' : false;

  return (
    <div
      onClick={() => onOpen(task)}
      className="group bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer p-4 space-y-3"
    >
      {/* Top row: priority + edit */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.priority && (
            <>
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[task.priority])} />
              <span className={cn('text-[10px] font-bold uppercase tracking-wider', PRIORITY_LABEL[task.priority])}>
                {task.priority}
              </span>
            </>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onEdit(task); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Title */}
      <p className={cn(
        'text-sm font-semibold text-slate-800 leading-snug line-clamp-2',
        task.status === 'done' && 'line-through text-slate-400'
      )}>
        {task.title}
      </p>

      {/* Description (non-compact) */}
      {!compact && task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Progress bar */}
      {progress > 0 && (
        <div className="space-y-1">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className={cn('flex items-center gap-1 text-[10px] font-medium', overdue ? 'text-red-500' : 'text-slate-400')}>
          <Calendar className="h-3 w-3" />
          {formatDate(task.due_date)}
        </div>
        <div className="flex items-center gap-2">
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <MessageSquare className="h-3 w-3" /> {commentCount}
            </span>
          )}
          {progress > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <BarChart2 className="h-3 w-3" /> {progress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
