'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAgencyId } from '@/lib/auth';
import { getProjects, getClients, type Project, type Client } from '@/lib/api';
import { FolderOpen, Users, Clock, ChevronRight, PlusCircle } from 'lucide-react';

function statusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'paused': return 'bg-yellow-100 text-yellow-700';
    case 'completed': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const agencyId = getAgencyId();
    if (!agencyId) { router.push('/login'); return; }

    Promise.all([getProjects(agencyId), getClients(agencyId)])
      .then(([p, c]) => { setProjects(p); setClients(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? '—';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{projects.length} projects</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg"><FolderOpen className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-500">Total Projects</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg"><Users className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              <p className="text-sm text-gray-500">Active Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-lg"><Clock className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Active Projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No projects yet.</p>
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">Client: {getClientName(project.client_id)}</p>
                  {project.description && (
                    <p className="text-sm text-gray-400 mt-1 truncate">{project.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}