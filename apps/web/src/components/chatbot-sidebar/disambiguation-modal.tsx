'use client';

import React, { useState } from 'react';
import { AlertCircle, Check, ChevronRight, Folder, HelpCircle, X } from 'lucide-react';

export interface SuggestedProject {
  id: string;
  name: string;
  matchConfidence?: number;
}

export interface AmbiguousEntry {
  rawText: string;
  durationMinutes: number;
  extractedTaskDescription: string;
  suggestedProjects?: SuggestedProject[];
  suggestedProjectKeywords?: string[];
}

interface DisambiguationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: AmbiguousEntry | null;
  allProjects: Array<{ id: string; name: string }>;
  onConfirm: (entry: AmbiguousEntry, selectedProjectId: string) => void;
}

export function DisambiguationModal({
  isOpen,
  onClose,
  entry,
  allProjects,
  onConfirm,
}: DisambiguationModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [customSelect, setCustomSelect] = useState<boolean>(false);

  React.useEffect(() => {
    if (entry?.suggestedProjects && entry.suggestedProjects.length > 0) {
      setSelectedProjectId(entry.suggestedProjects[0].id);
      setCustomSelect(false);
    } else if (allProjects.length > 0) {
      setSelectedProjectId(allProjects[0].id);
      setCustomSelect(true);
    }
  }, [entry, allProjects]);

  if (!isOpen || !entry) return null;

  const handleConfirm = () => {
    if (!selectedProjectId) return;
    onConfirm(entry, selectedProjectId);
    onClose();
  };

  const hours = Math.floor(entry.durationMinutes / 60);
  const minutes = entry.durationMinutes % 60;
  const durationText = `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim() || `${entry.durationMinutes}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Project Disambiguation</h2>
              <p className="text-xs text-slate-400">Multiple candidate projects matched your description</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-xs">Parsed Task</span>
            <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 font-bold border border-blue-500/20">
              {durationText}
            </span>
          </div>
          <p className="text-slate-300">{entry.extractedTaskDescription || entry.rawText}</p>
          {entry.suggestedProjectKeywords && entry.suggestedProjectKeywords.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
              <span>Keywords:</span>
              <div className="flex flex-wrap gap-1">
                {entry.suggestedProjectKeywords.map((kw, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Candidate Projects List */}
        <div className="space-y-2 text-xs">
          <label className="font-medium text-slate-300 flex items-center justify-between">
            <span>Select Matching Project:</span>
            <button
              type="button"
              onClick={() => setCustomSelect(!customSelect)}
              className="text-blue-400 hover:underline text-[11px]"
            >
              {customSelect ? 'Show Suggestions' : 'Pick from All Projects'}
            </button>
          </label>

          {!customSelect && entry.suggestedProjects && entry.suggestedProjects.length > 0 ? (
            <div className="space-y-2">
              {entry.suggestedProjects.map((p) => {
                const isSelected = selectedProjectId === p.id;
                const confidence = p.matchConfidence ? Math.round(p.matchConfidence * 100) : null;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>

                    {confidence !== null && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              confidence >= 80 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">{confidence}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-xl bg-slate-800/90 border border-slate-700 px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedProjectId}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm & Log Hours</span>
          </button>
        </div>
      </div>
    </div>
  );
}
