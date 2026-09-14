'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, Clock, LayoutDashboard, FolderKanban, Settings, LogOut } from 'lucide-react';
import { ChatSidebar } from '@/components/chatbot-sidebar/chat-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white">Timesheet AI</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                Default Corp
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium shadow"
            >
              <LayoutDashboard className="w-4 h-4" /> Timesheet Grid
            </Link>
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium transition"
            >
              <Bot className="w-4 h-4 text-blue-400" /> AI Log Assistant
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 flex items-center justify-between text-xs text-slate-400">
            <div>
              <p className="font-medium text-white">Dev User</p>
              <p className="text-[10px] text-slate-500">dev@default.com</p>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
              DEVELOPER
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/30 backdrop-blur">
          <h2 className="text-sm font-semibold text-white">Timesheet Overview</h2>
          <button
            onClick={() => setIsChatOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-medium transition"
          >
            <Bot className="w-3.5 h-3.5" /> Ask AI Worker
          </button>
        </header>

        <main className="p-6 flex-1">
          {children}
        </main>
      </div>

      {/* Slide-out AI Chat Drawer */}
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
