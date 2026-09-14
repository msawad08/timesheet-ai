'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Clock, Lock, Mail, User, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameChange = (val: string) => {
    setTenantName(val);
    setTenantSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiGatewayUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiGatewayUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName,
          tenantSlug,
          name,
          email,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-2xl border border-slate-800">
        <div className="text-center space-y-2">
          <div className="inline-flex p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Register New Organization</h1>
          <p className="text-xs text-slate-400">Initialize a multi-tenant timesheet environment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Organization / Tenant Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={tenantName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Acme Corporation"
              />
              <Building2 className="w-4 h-4 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Tenant Slug (Identifier)</label>
            <input
              type="text"
              required
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-400 font-mono focus:outline-none"
              placeholder="acme-corporation"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Admin Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jane Doe"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Admin Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@acme.com"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Master Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
          >
            {loading ? 'Setting up tenant...' : 'Create Organization'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800/80">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
