'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAgencyId, isClientUser } from '@/lib/auth';
import { getDashboard, getProject, type DashboardStats, type Project } from '@/lib/api';
import { ArrowLeft, Clock, CheckCircle, Loader, FileCheck } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}
function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const isClient = isClientUser();
  const agencyId = getAgencyId();

  useEffect(() => {
    if (!agencyId) { router.push('/login'); return; }
    Promise.all([getDashboard(agencyId, projectId), getProject(agencyId, projectId)])
      .then(([s, p]) => { setStats(s); setProject(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agencyId, projectId, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const counts = stats?.task_counts_by_status ?? {};
  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${projectId}`} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{project?.name} — Dashboard</h1>
          <p className="text-sm text-gray-500">Project health overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={total} icon={<Loader className="w-5 h-5 text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Done" value={counts.done ?? 0} icon={<CheckCircle className="w-5 h-5 text-green-600" />} color="bg-green-50" />
        <StatCard label="In Progress" value={counts.in_progress ?? 0} icon={<Loader className="w-5 h-5 text-yellow-600" />} color="bg-yellow-50" />
        {!isClient && (
          <StatCard label="Hours Logged" value={stats?.total_hours ?? 0} icon={<Clock className="w-5 h-5 text-purple-600" />} color="bg-purple-50" />
        )}
        <StatCard label="Pending Approvals" value={stats?.pending_approvals ?? 0} icon={<FileCheck className="w-5 h-5 text-orange-600" />} color="bg-orange-50" />
      </div>

      {/* Task status breakdown table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Tasks by Status</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {Object.entries(counts).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No tasks yet.</p>
          ) : (
            Object.entries(counts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-6 text-right">{count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}