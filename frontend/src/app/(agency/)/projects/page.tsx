'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAgencyId } from '@/lib/auth';
import { getProjects, getClients, createProject, type Project, type Client } from '@/lib/api';
import { FolderOpen, ArrowRight, PlusCircle } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newClientId, setNewClientId] = useState('');

  const agencyId = getAgencyId();

  useEffect(() => {
    if (!agencyId) return;
    Promise.all([getProjects(agencyId), getClients(agencyId)])
      .then(([p, c]) => {
        setProjects(p);
        setClients(c);
        if (c.length > 0) setNewClientId(c[0].id);
      })
      .finally(() => setLoading(false));
  }, [agencyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId || !newName.trim() || !newClientId) return;
    setCreating(true);
    try {
      const p = await createProject(agencyId, {
        name: newName,
        description: newDesc,
        client_id: newClientId
      });
      setProjects([...projects, p]);
      setNewName(''); setNewDesc(''); setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto relative">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> New Project
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="font-semibold text-gray-900 text-lg">Create New Project</h3>
            <input
              required value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description" rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <select
              required value={newClientId} onChange={(e) => setNewClientId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating || !newClientId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">Seed the database or check back later.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-200">
            {projects.map((p) => (
              <li key={p.id} className="group hover:bg-gray-50 transition-colors">
                <Link href={`/projects/${p.id}`} className="flex items-center justify-between p-4 sm:px-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                    {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {p.status}
                    </span>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
