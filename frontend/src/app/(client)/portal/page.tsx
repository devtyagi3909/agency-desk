'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAgencyId } from '@/lib/auth';
import { getProjects, type Project } from '@/lib/api';
import { FolderOpen, ChevronRight } from 'lucide-react';

function statusBadge(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'paused': return 'bg-yellow-100 text-yellow-700';
    case 'completed': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function ClientPortalPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const agencyId = getAgencyId();

  useEffect(() => {
    if (!agencyId) { router.push('/login'); return; }
    getProjects(agencyId).then(setProjects).catch(() => {}).finally(() => setLoading(false));
  }, [agencyId, router]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
        <p className="text-gray-500 text-sm mt-0.5">Projects shared with you by the agency</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm">Your agency will share projects with you here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/portal/projects/${project.id}`}
              className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-400 mt-1 truncate">{project.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}