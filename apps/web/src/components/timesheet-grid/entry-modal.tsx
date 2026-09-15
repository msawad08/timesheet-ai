'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, Folder, FileText, Trash2, Check } from 'lucide-react';

export interface TimeEntryFormData {
  id?: string;
  projectId: string;
  projectName?: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  rawComment?: string;
}

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TimeEntryFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Partial<TimeEntryFormData> | null;
  projects: Array<{ id: string; name: string }>;
}

export function EntryModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  projects,
}: EntryModalProps) {
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultDate = initialData?.date || new Date().toISOString().split('T')[0];
      setDate(defaultDate);

      const initialProjId =
        initialData?.projectId || (projects.length > 0 ? projects[0].id : '');
      setProjectId(initialProjId);

      const totalMins = initialData?.durationMinutes || 60;
      setHours(Math.floor(totalMins / 60).toString());
      setMinutes((totalMins % 60).toString());

      setComment(initialData?.rawComment || '');
      setError(null);
    }
  }, [isOpen, initialData, projects]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialData?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedHours = parseFloat(hours) || 0;
    const parsedMinutes = parseInt(minutes, 10) || 0;
    const totalMinutes = Math.round(parsedHours * 60 + parsedMinutes);

    if (totalMinutes <= 0) {
      setError('Duration must be greater than 0 minutes.');
      return;
    }

    if (!projectId) {
      setError('Please select a project.');
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: initialData?.id,
        projectId,
        date,
        durationMinutes: totalMinutes,
        rawComment: comment.trim() || 'Manual time entry',
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save timesheet entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      setIsSubmitting(true);
      await onDelete(initialData.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete time entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickDuration = (hrs: number) => {
    setHours(hrs.toString());
    setMinutes('0');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEditing ? 'Edit Time Entry' : 'Manual Time Entry'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update or delete your logged hours'
                  : 'Log hours manually against a project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Project Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-slate-300">
              <Folder className="w-3.5 h-3.5 text-blue-400" />
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-slate-300">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              required
            />
          </div>

          {/* Duration Inputs & Quick Presets */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Duration
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="1"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full bg-transparent text-white focus:outline-none text-sm font-medium"
                    placeholder="0"
                  />
                  <span className="text-slate-400 text-xs ml-1">hrs</span>
                </div>
              </div>
              <div>
                <div className="flex items-center rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-full bg-transparent text-white focus:outline-none text-sm font-medium"
                    placeholder="0"
                  />
                  <span className="text-slate-400 text-xs ml-1">mins</span>
                </div>
              </div>
            </div>

            {/* Quick Preset Badges */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 mr-1">Presets:</span>
              {[0.5, 1, 2, 4, 8].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setQuickDuration(h)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-medium transition"
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Comment / Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-slate-300">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Description & Task Notes
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you work on? (e.g., Fixed API gateway timeout issues)"
              className="w-full rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Log Time'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
