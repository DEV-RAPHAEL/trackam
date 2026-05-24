"use client";

import React from 'react';
import { Task, TaskStatus } from '@/types';
import { Calendar, Flag, MessageSquare, BarChart2, Edit2, Trash2 } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-500', medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600', urgent: 'bg-red-50 text-red-600',
};
const STATUS_STYLES: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-600', in_progress: 'bg-emerald-50 text-emerald-700',
  review: 'bg-amber-50 text-amber-700', done: 'bg-emerald-50 text-emerald-700',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
};

interface Props {
  tasks: Task[];
  onOpen: (t: Task) => void;
  onEdit: (t: Task) => void;
}

export function ListView({ tasks, onOpen, onEdit }: Props) {
  const { deleteTask, updateTask } = useStore();
  const sorted = [...(tasks || [])].sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime());

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="overflow-y-auto flex-1">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-5 py-3 w-8" />
              <th className="px-5 py-3">Task</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Progress</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map(task => {
              const overdue = task.due_date ? new Date(task.due_date) < new Date() && task.status !== 'done' : false;
              const progress = task.progress ?? 0;
              return (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => onOpen(task)}
                >
                  {/* Checkbox */}
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done', progress: task.status === 'done' ? 0 : 100 })}
                      className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                    />
                  </td>
                  {/* Title */}
                  <td className="px-5 py-3 max-w-xs">
                    <p className={cn('text-sm font-semibold text-slate-800', task.status === 'done' && 'line-through text-slate-400')}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-5 py-3">
                    <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full', STATUS_STYLES[task.status])}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  {/* Priority */}
                  <td className="px-5 py-3">
                    {task.priority && (
                      <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full flex items-center gap-1 w-fit', PRIORITY_STYLES[task.priority])}>
                        <Flag className="h-2.5 w-2.5" /> {task.priority}
                      </span>
                    )}
                  </td>
                  {/* Due date */}
                  <td className="px-5 py-3">
                    <span className={cn('text-xs font-medium flex items-center gap-1', overdue ? 'text-red-500' : 'text-slate-500')}>
                      <Calendar className="h-3 w-3" /> {formatDate(task.due_date)}
                    </span>
                  </td>
                  {/* Progress */}
                  <td className="px-5 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-violet-400 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 w-8">{progress}%</span>
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(task)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">No tasks yet. Click "New Task" to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
