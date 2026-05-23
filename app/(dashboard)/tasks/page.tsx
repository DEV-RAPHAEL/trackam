"use client";

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { Plus, LayoutGrid, List, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { KanbanView } from '@/components/tasks/KanbanView';
import { ListView } from '@/components/tasks/ListView';
import { GanttView } from '@/components/tasks/GanttView';

export type ViewMode = 'kanban' | 'list' | 'gantt';

export default function TasksPage() {
  const { tasks, currentUser } = useStore();
  const [view, setView] = useState<ViewMode>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openDetail = (task: Task) => setSelectedTask(task);
  const openEdit = (task: Task) => { setEditingTask(task); setIsModalOpen(true); };

  const totalDone = (tasks || []).filter(t => t.status === 'done').length;
  const totalTasks = (tasks || []).length;

  const views: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: 'kanban', icon: <LayoutGrid className="h-4 w-4" />, label: 'Board' },
    { id: 'list',   icon: <List className="h-4 w-4" />,        label: 'List'  },
    { id: 'gantt',  icon: <BarChart2 className="h-4 w-4" />,   label: 'Gantt' },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tasks</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {totalDone}/{totalTasks} completed
            {totalTasks > 0 && (
              <span className="ml-2 text-indigo-500 font-medium">
                {Math.round((totalDone / totalTasks) * 100)}%
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
            {views.map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  view === v.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${(totalDone / totalTasks) * 100}%` }}
          />
        </div>
      )}

      {/* View */}
      <div className="flex-1 min-h-0">
        {view === 'kanban' && <KanbanView tasks={tasks || []} onOpen={openDetail} onEdit={openEdit} />}
        {view === 'list'   && <ListView   tasks={tasks || []} onOpen={openDetail} onEdit={openEdit} />}
        {view === 'gantt'  && <GanttView  tasks={tasks || []} onOpen={openDetail} />}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        />
      )}

      {/* Detail Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={(tasks || []).find(t => t.id === selectedTask.id) ?? selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => { openEdit(selectedTask); setSelectedTask(null); }}
        />
      )}
    </div>
  );
}
