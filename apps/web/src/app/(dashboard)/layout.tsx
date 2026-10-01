'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Clock, LayoutDashboard, FolderKanban, Settings, LogOut } from 'lucide-react';
import { ChatSidebar } from '@/components/chatbot-sidebar/chat-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const pathname = usePathname();

  const [userProfile, setUserProfile] = useState({
    name: 'Mohammed Sawad',
    email: 'msawad08@gmail.com',
    role: 'ADMIN',
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dev@default.com', password: 'Password123!' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
          }
        })
        .catch(() => {});
    }

    const saved = localStorage.getItem('timesheet_ai_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserProfile({
          name: parsed.fullName || 'Mohammed Sawad',
          email: parsed.email || 'msawad08@gmail.com',
          role: parsed.role || 'ADMIN',
        });
      } catch {}
    }
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname === '/projects') return 'Project Configurations';
    if (pathname === '/settings') return 'Settings & Preferences';
    return 'Timesheet Overview';
  };

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
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                pathname === '/dashboard'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Timesheet Grid
            </Link>

            <Link
              href="/projects"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                pathname === '/projects'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderKanban className="w-4 h-4" /> Projects
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                pathname === '/settings'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
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
            <div className="truncate max-w-[140px]">
              <p className="font-medium text-white truncate">{userProfile.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{userProfile.email}</p>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold shrink-0">
              {userProfile.role}
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
          <h2 className="text-sm font-semibold text-white">{getPageTitle()}</h2>
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
