'use client';

import React, { useState } from 'react';
import { TimesheetGrid } from '@/components/timesheet-grid/timesheet-grid';
import { ChatSidebar } from '@/components/chatbot-sidebar/chat-sidebar';

export default function DashboardPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="space-y-6">
      <TimesheetGrid onOpenChat={() => setIsChatOpen(true)} />
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
