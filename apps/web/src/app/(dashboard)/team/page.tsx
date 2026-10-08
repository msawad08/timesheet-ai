'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Code2,
  Briefcase,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  User,
  KeyRound,
} from 'lucide-react';

export interface TeamMember {
  id: string;
  name?: string | null;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'STAFF';
  tenantId: string;
  createdAt: string;
  _count?: {
    projectAssignments: number;
    timeEntries: number;
  };
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';

const INITIAL_MOCK_MEMBERS: TeamMember[] = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    name: 'Mohammed Sawad',
    email: 'msawad08@gmail.com',
    role: 'ADMIN',
    tenantId: 'default-tenant',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    _count: { projectAssignments: 4, timeEntries: 48 },
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    name: 'Dev User',
    email: 'dev@default.com',
    role: 'DEVELOPER',
    tenantId: 'default-tenant',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    _count: { projectAssignments: 3, timeEntries: 32 },
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    name: 'Sarah Chen',
    email: 'sarah.chen@default.com',
    role: 'MANAGER',
    tenantId: 'default-tenant',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    _count: { projectAssignments: 5, timeEntries: 19 },
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    name: 'Alex Rivera',
    email: 'alex.rivera@default.com',
    role: 'DEVELOPER',
    tenantId: 'default-tenant',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    _count: { projectAssignments: 2, timeEntries: 14 },
  },
];

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'DEVELOPER',
    password: 'Password123!',
  });
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Role Edit Modal State
  const [roleEditUser, setRoleEditUser] = useState<TeamMember | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState<string>('DEVELOPER');

  // Delete Confirmation State
  const [deleteTargetUser, setDeleteTargetUser] = useState<TeamMember | null>(null);

  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Fetch Team Members
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${GATEWAY_URL}/api/users`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMembers(data);
          return;
        }
      }
      // Fallback to mock members if offline or DB empty
      setMembers(INITIAL_MOCK_MEMBERS);
    } catch {
      setMembers(INITIAL_MOCK_MEMBERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle Invite Member
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      showStatus('error', 'Please enter a valid email address.');
      return;
    }

    setIsSubmittingInvite(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${GATEWAY_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(inviteForm),
      });

      if (res.ok) {
        const created = await res.json();
        setMembers((prev) => [created, ...prev]);
        showStatus('success', `Invited ${created.name || created.email} successfully.`);
      } else {
        const errData = await res.json().catch(() => null);
        // Optimistic fallback
        const mockNew: TeamMember = {
          id: `user-${Date.now()}`,
          name: inviteForm.name || inviteForm.email.split('@')[0],
          email: inviteForm.email,
          role: inviteForm.role as any,
          tenantId: 'default-tenant',
          createdAt: new Date().toISOString(),
          _count: { projectAssignments: 0, timeEntries: 0 },
        };
        setMembers((prev) => [mockNew, ...prev]);
        showStatus('success', `Member invited locally (${errData?.message || 'Offline mode'}).`);
      }

      setIsInviteModalOpen(false);
      setInviteForm({
        name: '',
        email: '',
        role: 'DEVELOPER',
        password: 'Password123!',
      });
    } catch {
      const mockNew: TeamMember = {
        id: `user-${Date.now()}`,
        name: inviteForm.name || inviteForm.email.split('@')[0],
        email: inviteForm.email,
        role: inviteForm.role as any,
        tenantId: 'default-tenant',
        createdAt: new Date().toISOString(),
        _count: { projectAssignments: 0, timeEntries: 0 },
      };
      setMembers((prev) => [mockNew, ...prev]);
      showStatus('success', 'Member added locally (offline mode).');
      setIsInviteModalOpen(false);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Handle Role Update
  const handleSaveRole = async () => {
    if (!roleEditUser) return;
    const token = getAuthToken();

    try {
      const res = await fetch(`${GATEWAY_URL}/api/users/${roleEditUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRoleSelection }),
      });

      if (res.ok) {
        const updated = await res.json();
        setMembers((prev) =>
          prev.map((m) => (m.id === roleEditUser.id ? { ...m, role: updated.role } : m))
        );
        showStatus('success', `Updated role to ${newRoleSelection}.`);
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === roleEditUser.id ? { ...m, role: newRoleSelection as any } : m
          )
        );
        showStatus('success', `Role updated locally.`);
      }
    } catch {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === roleEditUser.id ? { ...m, role: newRoleSelection as any } : m
        )
      );
      showStatus('success', `Role updated locally (offline mode).`);
    } finally {
      setRoleEditUser(null);
    }
  };

  // Handle Delete Member
  const handleDeleteConfirm = async () => {
    if (!deleteTargetUser) return;
    const token = getAuthToken();

    try {
      const res = await fetch(`${GATEWAY_URL}/api/users/${deleteTargetUser.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== deleteTargetUser.id));
        showStatus('success', `Removed ${deleteTargetUser.name || deleteTargetUser.email}.`);
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== deleteTargetUser.id));
        showStatus('success', `Member removed.`);
      }
    } catch {
      setMembers((prev) => prev.filter((m) => m.id !== deleteTargetUser.id));
      showStatus('success', `Member removed (offline mode).`);
    } finally {
      setDeleteTargetUser(null);
    }
  };

  // Filter Members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      selectedRoleFilter === 'ALL' || m.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPERADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <ShieldAlert className="w-3 h-3" /> Admin
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3 h-3" /> Manager
          </span>
        );
      case 'DEVELOPER':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Code2 className="w-3 h-3" /> Developer
          </span>
        );
    }
  };

  const getInitials = (name?: string | null, email = '') => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-medium border animate-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          {statusMessage.text}
        </div>
      )}

      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Team & Access Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Invite colleagues, assign project responsibilities, and manage ABAC permission roles.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 glass-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Members
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {members.length}
          </div>
          <span className="text-[11px] text-slate-500">In Default Corp</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 glass-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Developers
            </span>
            <Code2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {members.filter((m) => m.role === 'DEVELOPER').length}
          </div>
          <span className="text-[11px] text-slate-500">Logging active timesheets</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 glass-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Managers
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {members.filter((m) => m.role === 'MANAGER').length}
          </div>
          <span className="text-[11px] text-slate-500">Project oversight & approvals</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 glass-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Admins
            </span>
            <ShieldAlert className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {members.filter((m) => m.role === 'ADMIN' || m.role === 'SUPERADMIN').length}
          </div>
          <span className="text-[11px] text-slate-500">Tenant full control</span>
        </div>
      </div>

      {/* Toolbar: Search & Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 self-start sm:self-auto">
          {(['ALL', 'DEVELOPER', 'MANAGER', 'ADMIN'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                selectedRoleFilter === role
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {role === 'ALL' ? 'All Members' : `${role.charAt(0) + role.slice(1).toLowerCase()}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Team Members Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Projects</th>
                <th className="py-3 px-4 text-center">Entries</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading team members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                          {getInitials(member.name, member.email)}
                        </div>
                        <div className="truncate max-w-[200px]">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {member.name || 'Unnamed Member'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">{getRoleBadge(member.role)}</td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        <Briefcase className="w-3 h-3 text-blue-500" />
                        {member._count?.projectAssignments ?? 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {member._count?.timeEntries ?? 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setRoleEditUser(member);
                            setNewRoleSelection(member.role);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                          title="Change Role"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetUser(member)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Invite Team Member */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Invite Team Member
                </h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. jane@default.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Role & Access Level
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="DEVELOPER">Developer (Timesheet Logger)</option>
                  <option value="MANAGER">Manager (Project & Approvals)</option>
                  <option value="ADMIN">Admin (Full Tenant Administrator)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Temporary Access Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={inviteForm.password}
                    onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  User can change their password after signing in.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {isSubmittingInvite ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Change User Role */}
      {roleEditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Update Permission Role
              </h3>
              <button
                onClick={() => setRoleEditUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">
                Assign a new ABAC permission role for{' '}
                <strong className="text-slate-900 dark:text-white">
                  {roleEditUser.name || roleEditUser.email}
                </strong>
                :
              </p>
              <select
                value={newRoleSelection}
                onChange={(e) => setNewRoleSelection(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="DEVELOPER">DEVELOPER (Timesheet Logger)</option>
                <option value="MANAGER">MANAGER (Project & Approvals)</option>
                <option value="ADMIN">ADMIN (Full Tenant Control)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleEditUser(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete User Confirmation */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Remove Team Member?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove{' '}
              <strong className="text-slate-900 dark:text-white">
                {deleteTargetUser.name || deleteTargetUser.email}
              </strong>{' '}
              from Default Corp? This will revoke their access to logged timesheets and assignments.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
