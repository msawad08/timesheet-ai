'use client';

import { useState, useCallback } from 'react';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export function useSseChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);

  const sendMessage = useCallback(async (messageText: string, token?: string) => {
    if (!messageText.trim()) return;

    setIsStreaming(true);
    setMessages((prev) => [...prev, { sender: 'user', text: messageText }]);

    const aiWorkerUrl =
      process.env.NEXT_PUBLIC_AI_WORKER_URL || 'http://localhost:3002';

    const effectiveToken =
      token ||
      (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    try {
      const response = await fetch(`${aiWorkerUrl}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errJson = await response.json();
          errorDetail = errJson.error || errJson.message || JSON.stringify(errJson);
        } catch {
          const errText = await response.text();
          if (errText) errorDetail = errText;
        }

        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: `Error: ${errorDetail}` },
        ]);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setIsStreaming(false);
        return;
      }

      let aiMessage = '';
      setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.substring(6).trim();
            try {
              const payload = JSON.parse(content);
              if (payload.status) {
                setParsedData(payload);
              }
            } catch {
              aiMessage += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { sender: 'ai', text: aiMessage };
                return updated;
              });
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Network error: ${err.message || err}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, parsedData, sendMessage, setParsedData };
}
