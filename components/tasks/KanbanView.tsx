"use client";

import React from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const COLUMNS: { id: TaskStatus; label: string; color: string; dot: string }[] = [
  { id: 'todo',        label: 'To Do',       color: 'bg-slate-100',   dot: 'bg-slate-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-emerald-50',   dot: 'bg-emerald-500' },
  { id: 'review',      label: 'In Review',   color: 'bg-amber-50',    dot: 'bg-amber-500' },
  { id: 'done',        label: 'Done',        color: 'bg-emerald-50',  dot: 'bg-emerald-500' },
];

interface Props {
  tasks: Task[];
  onOpen: (t: Task) => void;
  onEdit: (t: Task) => void;
}

export function KanbanView({ tasks, onOpen, onEdit }: Props) {
  const { updateTask } = useStore();

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) updateTask(taskId, { status });
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-72 flex flex-col"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, col.id)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', col.dot)} />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{col.label}</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
                {colTasks.length}
              </span>
            </div>

            {/* Drop zone */}
            <div className={cn(
              'flex-1 rounded-xl p-2 space-y-2 overflow-y-auto min-h-[120px] border-2 border-dashed transition-colors',
              col.color, 'border-transparent'
            )}>
              {colTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                >
                  <TaskCard task={task} onOpen={onOpen} onEdit={onEdit} />
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-slate-400">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
