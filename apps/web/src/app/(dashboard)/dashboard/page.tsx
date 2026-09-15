'use client';

import React, { useState } from 'react';
import { TimesheetGrid } from '@/components/timesheet-grid/timesheet-grid';
import { ChatSidebar } from '@/components/chatbot-sidebar/chat-sidebar';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEntryCommitted = async (entry: any) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        projectId: entry.projectId || '11111111-1111-4111-8111-111111111111',
        date: new Date(entry.date || today).toISOString(),
        durationMinutes: entry.durationMinutes || 60,
        rawComment: entry.extractedTaskDescription || entry.rawText || 'AI assisted timesheet entry',
      };

      await fetch(`${GATEWAY_URL}/api/time-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // Refresh the grid to display the newly committed entry
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.warn('Failed to persist AI entry to gateway:', err);
      // Still trigger refresh in case local state updated
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <TimesheetGrid
        onOpenChat={() => setIsChatOpen(true)}
        refreshTrigger={refreshTrigger}
      />
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onEntryCommitted={handleEntryCommitted}
      />
    </div>
  );
}
