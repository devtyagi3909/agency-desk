'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAgencyId, isClientUser } from '@/lib/auth';
import { getTasks, createTask, getProject, getClients, type Task, type Project } from '@/lib/api';
import KanbanBoard from '@/components/KanbanBoard';
import { BarChart2, PlusCircle, ArrowLeft } from 'lucide-react';

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newInternal, setNewInternal] = useState(false);
  const [creating, setCreating] = useState(false);
  const isClient = isClientUser();

  const agencyId = getAgencyId();

  useEffect(() => {
    if (!agencyId) { router.push('/login'); return; }
    Promise.all([
      getTasks(agencyId, projectId),
      getProject(agencyId, projectId),
    ]).then(([t, p]) => {
      setTasks(t);
      setProject(p);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [agencyId, projectId, router]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const t = await createTask(agencyId, projectId, {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        is_internal: newInternal,
      });
      setTasks((prev) => [...prev, t]);
      setNewTitle(''); setNewDesc(''); setNewInternal(false);
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project?.name ?? 'Project'}</h1>
            <p className="text-sm text-gray-500">{tasks.length} tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}/dashboard`}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <BarChart2 className="w-4 h-4" /> Dashboard
          </Link>
          {!isClient && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Create task modal */}
      {showCreate && !isClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="font-semibold text-gray-900 text-lg">New Task</h3>
            <input
              required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <select
              value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={newInternal} onChange={(e) => setNewInternal(e.target.checked)} className="rounded" />
              Internal (agency-only)
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1">
        <KanbanBoard tasks={tasks} agencyId={agencyId} onTasksChange={setTasks} />
      </div>
    </div>
  );
}