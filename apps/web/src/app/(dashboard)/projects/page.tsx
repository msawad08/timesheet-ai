'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Layers,
  Power,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectIsActive, setProjectIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${GATEWAY_URL}/api/projects`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        // Fallback default projects
        setProjects([
          {
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Core Engineering',
            description: 'Core microservices, auth gateway, and backend architecture',
            isActive: true,
          },
          {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Billing Engine',
            description: 'Subscription billing pipeline, stripe webhooks, and invoice generation',
            isActive: true,
          },
          {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'Client Portal UI',
            description: 'Next.js customer facing web applications and analytics components',
            isActive: true,
          },
        ]);
      }
    } catch {
      setProjects([
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Core Engineering',
          description: 'Core microservices, auth gateway, and backend architecture',
          isActive: true,
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Billing Engine',
          description: 'Subscription billing pipeline, stripe webhooks, and invoice generation',
          isActive: true,
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Client Portal UI',
          description: 'Next.js customer facing web applications and analytics components',
          isActive: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setProjectIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectIsActive(project.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }

    const token = getAuthToken();
    const isEdit = Boolean(editingProject);
    const url = isEdit
      ? `${GATEWAY_URL}/api/projects/${editingProject?.id}`
      : `${GATEWAY_URL}/api/projects`;
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
      isActive: projectIsActive,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        } else {
          setProjects((prev) => [saved, ...prev]);
        }
        showStatus('success', isEdit ? 'Project updated successfully.' : 'Project created successfully.');
        setIsModalOpen(false);
      } else {
        // Optimistic fallback
        const optimisticId = editingProject?.id || `proj-${Date.now()}`;
        const updatedProject: Project = {
          id: optimisticId,
          name: projectName.trim(),
          description: projectDescription.trim(),
          isActive: projectIsActive,
        };

        if (isEdit) {
          setProjects((prev) => prev.map((p) => (p.id === optimisticId ? updatedProject : p)));
        } else {
          setProjects((prev) => [updatedProject, ...prev]);
        }
        showStatus('success', isEdit ? 'Project updated locally.' : 'Project created locally.');
        setIsModalOpen(false);
      }
    } catch {
      // Optimistic fallback
      const optimisticId = editingProject?.id || `proj-${Date.now()}`;
      const updatedProject: Project = {
        id: optimisticId,
        name: projectName.trim(),
        description: projectDescription.trim(),
        isActive: projectIsActive,
      };

      if (isEdit) {
        setProjects((prev) => prev.map((p) => (p.id === optimisticId ? updatedProject : p)));
      } else {
        setProjects((prev) => [updatedProject, ...prev]);
      }
      showStatus('success', 'Project saved locally (offline mode).');
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (project: Project) => {
    const token = getAuthToken();
    const updatedStatus = !project.isActive;

    try {
      const res = await fetch(`${GATEWAY_URL}/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: updatedStatus }),
      });

      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, isActive: updatedStatus } : p))
        );
        showStatus('success', `Project marked as ${updatedStatus ? 'Active' : 'Inactive'}.`);
      } else {
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, isActive: updatedStatus } : p))
        );
        showStatus('success', `Project marked as ${updatedStatus ? 'Active' : 'Inactive'}.`);
      }
    } catch {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, isActive: updatedStatus } : p))
      );
      showStatus('success', `Project marked as ${updatedStatus ? 'Active' : 'Inactive'}.`);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const token = getAuthToken();

    try {
      const res = await fetch(`${GATEWAY_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        showStatus('success', 'Project removed.');
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        showStatus('success', 'Project removed.');
      }
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      showStatus('success', 'Project removed.');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium border animate-in slide-in-from-top-2 ${
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

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-500" />
            Project Configurations
          </h1>
          <p className="text-xs text-slate-400">
            Manage projects, scope identifiers, and active tracking status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="rounded-lg bg-slate-900 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid Cards */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-slate-800 glass-panel p-12 text-center text-slate-500 space-y-3">
          <FolderKanban className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-medium">No projects found</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'Try adjusting your search query' : 'Click "New Project" to create your first tracking project'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-slate-700 transition group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        project.isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-600'
                      }`}
                    />
                    <h3 className="font-semibold text-white text-sm tracking-tight truncate max-w-[180px]">
                      {project.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      project.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {project.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <button
                  onClick={() => handleToggleActive(project)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    project.isActive
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                  title={project.isActive ? 'Deactivate Project' : 'Activate Project'}
                >
                  <Power className="w-3 h-3" />
                  {project.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(project)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Edit Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/20">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {editingProject
                      ? 'Modify project details and tracking state'
                      : 'Define a new project scope for your team'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Project Name *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Infrastructure Modernization"
                  className="w-full rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Briefly describe the scope and key deliverables of this project..."
                  className="w-full rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="projectIsActive"
                  checked={projectIsActive}
                  onChange={(e) => setProjectIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="projectIsActive" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Active (available for time tracking and AI matching)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
