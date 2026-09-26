'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAgencyId } from '@/lib/auth';
import { getProjects, type Project } from '@/lib/api';
import { FolderOpen, ArrowRight } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const agencyId = getAgencyId();
    if (!agencyId) return;

    getProjects(agencyId).then(setProjects).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
      </div>

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
