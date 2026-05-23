"use client";

import React, { useMemo } from 'react';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

const PRIORITY_BAR: Record<string, string> = {
  low:    'bg-slate-400',
  medium: 'bg-blue-500',
  high:   'bg-orange-500',
  urgent: 'bg-red-500',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
};

interface Props {
  tasks: Task[];
  onOpen: (t: Task) => void;
}

export function GanttView({ tasks, onOpen }: Props) {
  // Build 28-day window centred around today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const DAY_PX = 36;
  const DAYS = 28;

  const days = useMemo(() => {
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i - 7); // 7 days before today
      return d;
    });
  }, []);

  const rangeStart = days[0];
  const rangeEnd   = days[days.length - 1];

  const todayOffset = 7; // today is at index 7

  const getBarStyle = (task: Task) => {
    const start = task.start_date ? new Date(task.start_date) : new Date(task.created_at);
    const end   = new Date(task.due_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const startDiff = Math.floor((start.getTime() - rangeStart.getTime()) / 86400000);
    const endDiff   = Math.floor((end.getTime()   - rangeStart.getTime()) / 86400000);

    const left  = Math.max(0, startDiff) * DAY_PX;
    const right = Math.min(DAYS - 1, endDiff) * DAY_PX + DAY_PX;
    const width = Math.max(DAY_PX, right - left);

    return { left, width };
  };

  const ROW_H = 56;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <div className="flex" style={{ minWidth: 280 + DAYS * DAY_PX }}>
          {/* Task name column — fixed */}
          <div className="flex-shrink-0 w-64 border-r border-slate-100">
            {/* Header */}
            <div className="h-10 px-4 flex items-center border-b border-slate-100 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task</span>
            </div>
            {(tasks || []).map(task => (
              <div
                key={task.id}
                style={{ height: ROW_H }}
                className="px-4 flex flex-col justify-center border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => onOpen(task)}
              >
                <p className={cn('text-sm font-semibold text-slate-800 line-clamp-1', task.status === 'done' && 'line-through text-slate-400')}>
                  {task.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{STATUS_LABELS[task.status]}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto">
            {/* Day headers */}
            <div className="flex border-b border-slate-100 bg-slate-50 h-10 sticky top-0 z-10">
              {days.map((d, i) => {
                const isToday = i === todayOffset;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    style={{ width: DAY_PX, flexShrink: 0 }}
                    className={cn(
                      'flex flex-col items-center justify-center border-r border-slate-100 text-center',
                      isToday && 'bg-indigo-50',
                      isWeekend && !isToday && 'bg-slate-50/80'
                    )}
                  >
                    <span className={cn('text-[9px] font-bold', isToday ? 'text-indigo-600' : 'text-slate-400')}>
                      {d.toLocaleDateString('en', { weekday: 'narrow' })}
                    </span>
                    <span className={cn('text-[10px] font-bold', isToday ? 'text-indigo-700' : 'text-slate-500')}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            <div className="relative" style={{ width: DAYS * DAY_PX }}>
              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-indigo-400 z-10 opacity-60"
                style={{ left: todayOffset * DAY_PX + DAY_PX / 2 }}
              />

              {/* Grid lines */}
              {days.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-slate-100"
                  style={{ left: i * DAY_PX }}
                />
              ))}

              {/* Task bars */}
              {(tasks || []).map(task => {
                const { left, width } = getBarStyle(task);
                const progress = task.progress ?? 0;
                const barColor = PRIORITY_BAR[task.priority ?? 'medium'];
                return (
                  <div
                    key={task.id}
                    style={{ height: ROW_H }}
                    className="relative flex items-center border-b border-slate-50"
                    onClick={() => onOpen(task)}
                  >
                    <div
                      className="absolute rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                      style={{ left: left + 2, width: width - 4, height: 28 }}
                      title={task.title}
                    >
                      {/* Background */}
                      <div className={cn('absolute inset-0 opacity-20', barColor)} />
                      {/* Progress fill */}
                      <div
                        className={cn('absolute left-0 top-0 bottom-0 opacity-70', barColor)}
                        style={{ width: `${progress}%` }}
                      />
                      {/* Label */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-[10px] font-bold text-slate-700 truncate">{task.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(tasks || []).length === 0 && (
                <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                  No tasks to display
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400 bg-slate-50">
        <span className="font-semibold uppercase tracking-wider">Priority:</span>
        {Object.entries(PRIORITY_BAR).map(([k, cls]) => (
          <span key={k} className="flex items-center gap-1 capitalize font-medium">
            <span className={cn('w-3 h-3 rounded', cls)} />{k}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1">
          <span className="w-3 h-0.5 bg-indigo-400 opacity-60 inline-block" /> Today
        </span>
      </div>
    </div>
  );
}
