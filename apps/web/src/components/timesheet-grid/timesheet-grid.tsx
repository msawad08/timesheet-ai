'use client';

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Filter } from 'lucide-react';

export interface TimesheetGridItem {
  id: string;
  projectName: string;
  projectId: string;
  entries: { [dateKey: string]: number }; // dateKey (YYYY-MM-DD) -> minutes
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TimesheetGrid({ onOpenChat }: { onOpenChat: () => void }) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Sample seed data to display initial interactive grid
  const [gridData, setGridData] = useState<TimesheetGridItem[]>([
    {
      id: 'proj-1',
      projectName: 'Core Engineering',
      projectId: '00000000-0000-0000-0000-000000000001',
      entries: {
        '2026-09-14': 240,
        '2026-09-15': 180,
      },
    },
    {
      id: 'proj-2',
      projectName: 'Internal Dashboard',
      projectId: '00000000-0000-0000-0000-000000000002',
      entries: {
        '2026-09-14': 120,
        '2026-09-16': 240,
      },
    },
  ]);

  // Format minutes to display format (e.g. 4.0h)
  const formatHours = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1">
            {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs">
            <button className="p-1 hover:bg-slate-800 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium px-2">Week of Sep 14 - Sep 20, 2026</span>
            <button className="p-1 hover:bg-slate-800 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
          >
            <Clock className="w-4 h-4" /> Log with AI Assistant
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 glass-panel">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400 font-medium uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[200px]">Project</th>
              {DAYS_OF_WEEK.map((day, i) => (
                <th key={day} className="py-3 px-3 text-center min-w-[80px]">
                  <div>{day}</div>
                  <div className="text-[10px] text-slate-500 font-normal">Sep {14 + i}</div>
                </th>
              ))}
              <th className="py-3 px-4 text-right min-w-[90px]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 text-xs">
            {gridData.map((project) => {
              const totalMinutes = Object.values(project.entries).reduce((a, b) => a + b, 0);

              return (
                <tr key={project.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {project.projectName}
                  </td>

                  {DAYS_OF_WEEK.map((_, i) => {
                    const dateKey = `2026-09-${14 + i}`;
                    const mins = project.entries[dateKey];

                    return (
                      <td key={dateKey} className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded ${
                            mins
                              ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/20'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatHours(mins)}
                        </span>
                      </td>
                    );
                  })}

                  <td className="py-3 px-4 text-right font-bold text-slate-200">
                    {formatHours(totalMinutes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-800 bg-slate-900/80 font-bold text-xs text-slate-300">
              <td className="py-3 px-4">Total Logged</td>
              {DAYS_OF_WEEK.map((_, i) => {
                const dateKey = `2026-09-${14 + i}`;
                const dailyTotal = gridData.reduce(
                  (acc, item) => acc + (item.entries[dateKey] || 0),
                  0
                );
                return (
                  <td key={dateKey} className="py-3 px-3 text-center text-blue-400">
                    {formatHours(dailyTotal)}
                  </td>
                );
              })}
              <td className="py-3 px-4 text-right text-emerald-400">
                {formatHours(
                  gridData.reduce(
                    (acc, p) => acc + Object.values(p.entries).reduce((a, b) => a + b, 0),
                    0
                  )
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
