'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useSseChat } from '@/hooks/use-sse-chat';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEntryCommitted?: (entry: any) => void;
}

export function ChatSidebar({ isOpen, onClose, onEntryCommitted }: ChatSidebarProps) {
  const [inputText, setInputText] = useState('');
  const { messages, isStreaming, parsedData, sendMessage, setParsedData } = useSseChat();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleApplyEntry = (entry: any, selectedProjectId?: string) => {
    if (onEntryCommitted) {
      onEntryCommitted({
        ...entry,
        projectId: selectedProjectId || entry.matchedProjectId,
      });
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Timesheet AI Assistant</h2>
            <p className="text-xs text-slate-400">Ollama SSE Streaming Agent</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
            <Sparkles className="w-10 h-10 text-blue-500/40" />
            <p className="text-sm">Describe what you worked on in natural language:</p>
            <div className="space-y-2 text-xs text-slate-400 text-left w-full max-w-xs">
              <button
                onClick={() => setInputText('Worked 3 hours fixing API gateway timeout issues on the billing engine')}
                className="w-full p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left border border-slate-700/50 transition"
              >
                &ldquo;Worked 3 hours fixing API gateway timeout issues on billing engine&rdquo;
              </button>
              <button
                onClick={() => setInputText('2.5 hours designing Next.js dashboard grid layout components')}
                className="w-full p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left border border-slate-700/50 transition"
              >
                &ldquo;2.5 hours designing Next.js dashboard grid layout components&rdquo;
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'glass-panel text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Generating response & parsing time entries...
          </div>
        )}

        {/* Parsed Output / Actions */}
        {parsedData && parsedData.data?.entries && (
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                {parsedData.status === 'AMBIGUOUS_PROJECT' ? (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                Parsed Time Entries ({parsedData.data.entries.length})
              </span>
              <span className="text-slate-400">{parsedData.status}</span>
            </div>

            <div className="space-y-2">
              {parsedData.data.entries.map((entry: any, eIdx: number) => (
                <div
                  key={eIdx}
                  className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex justify-between font-medium text-slate-200">
                    <span>{entry.extractedTaskDescription}</span>
                    <span className="text-blue-400 shrink-0 font-bold ml-2">
                      {Math.floor(entry.durationMinutes / 60)}h {entry.durationMinutes % 60}m
                    </span>
                  </div>

                  {entry.suggestedProjects && entry.suggestedProjects.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[11px] text-slate-400 mb-1">Suggested Project:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.suggestedProjects.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => handleApplyEntry(entry, p.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-blue-600/40 text-slate-300 border border-slate-700 text-[11px] transition"
                          >
                            {p.name} ({Math.round(p.matchConfidence * 100)}%)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleApplyEntry(entry)}
                    className="w-full mt-2 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition"
                  >
                    Confirm & Add to Timesheet
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isStreaming}
            placeholder="Type your timesheet update..."
            className="w-full rounded-xl bg-slate-800/80 border border-slate-700 pl-4 pr-12 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            className="absolute right-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
