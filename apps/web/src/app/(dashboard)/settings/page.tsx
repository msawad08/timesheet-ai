'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  Cpu,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Shield,
  Activity,
  Download,
  Trash2,
} from 'lucide-react';

interface UserSettings {
  fullName: string;
  email: string;
  role: string;
  weeklyTargetHours: number;
  orgName: string;
  tenantSlug: string;
  timezone: string;
  aiWorkerUrl: string;
  aiProvider: string;
  aiModel: string;
  temperature: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  fullName: 'Mohammed Sawad',
  email: 'msawad08@gmail.com',
  role: 'ADMIN',
  weeklyTargetHours: 40,
  orgName: 'Default Corp',
  tenantSlug: 'default-tenant',
  timezone: 'UTC',
  aiWorkerUrl: process.env.NEXT_PUBLIC_AI_WORKER_URL || 'http://localhost:3002',
  aiProvider: 'ollama',
  aiModel: 'qwen2.5:3b',
  temperature: 0.1,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'online' | 'offline'>('idle');

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('timesheet_ai_settings');
      if (saved) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch {
          // fallback to defaults
        }
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('timesheet_ai_settings', JSON.stringify(settings));
    }
    showStatus('success', 'Preferences and organization settings saved successfully.');
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Test AI Worker Connectivity
  const testAiConnection = async () => {
    setIsTestingAi(true);
    setAiStatus('idle');

    try {
      const res = await fetch(`${settings.aiWorkerUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setAiStatus('online');
        showStatus('success', 'AI Worker is online and reachable.');
      } else {
        setAiStatus('offline');
        showStatus('error', `AI Worker returned status ${res.status}.`);
      }
    } catch {
      setAiStatus('offline');
      showStatus('error', 'Could not connect to AI Worker service at ' + settings.aiWorkerUrl);
    } finally {
      setIsTestingAi(false);
    }
  };

  // Export system backup
  const handleExportSystemBackup = () => {
    const backupData = {
      settings,
      exportedAt: new Date().toISOString(),
      localStorageSnapshot: typeof window !== 'undefined' ? { ...localStorage } : {},
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timesheet_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showStatus('success', 'Backup exported successfully.');
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all preferences to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('timesheet_ai_settings');
      }
      showStatus('success', 'Settings reset to factory defaults.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-medium border animate-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          {statusMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System & Account Settings</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal profile, tenant configuration, and local AI model integration.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Personal Profile */}
        <div className="rounded-xl border border-slate-800 glass-panel p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <User className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Personal Profile & Timesheet Target</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={settings.fullName}
                onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Role & ABAC Permission
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-white">{settings.role}</span>
                <span className="text-[11px] text-slate-500">(Full tenant access & entry management)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Weekly Target (Hours)
              </label>
              <input
                type="number"
                min="10"
                max="80"
                step="1"
                value={settings.weeklyTargetHours}
                onChange={(e) =>
                  setSettings({ ...settings, weeklyTargetHours: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Organization & Tenant Settings */}
        <div className="rounded-xl border border-slate-800 glass-panel p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <Building className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Tenant & Isolation Environment</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                value={settings.orgName}
                onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tenant Slug
              </label>
              <input
                type="text"
                disabled
                value={settings.tenantSlug}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Isolation Mode
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-medium">
                <Database className="w-3.5 h-3.5" />
                <span>Multi-Tenant Row Level</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: AI Worker & Model Configuration */}
        <div className="rounded-xl border border-slate-800 glass-panel p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Fastify AI Streaming Worker</h3>
            </div>

            {/* Test Connection Button */}
            <button
              type="button"
              onClick={testAiConnection}
              disabled={isTestingAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-50"
            >
              <Activity
                className={`w-3.5 h-3.5 ${
                  aiStatus === 'online'
                    ? 'text-emerald-400'
                    : aiStatus === 'offline'
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              />
              <span>{isTestingAi ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                AI Worker URL
              </label>
              <input
                type="text"
                value={settings.aiWorkerUrl}
                onChange={(e) => setSettings({ ...settings, aiWorkerUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                LLM Provider Engine
              </label>
              <select
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ollama">Ollama (Local Container)</option>
                <option value="gemini">Google Gemini API</option>
                <option value="openai">OpenAI API</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Active Parsing Model
              </label>
              <input
                type="text"
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Data Management & Diagnostics */}
        <div className="rounded-xl border border-slate-800 glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <Database className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Data Management & Diagnostics</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportSystemBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export System Backup (JSON)</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
