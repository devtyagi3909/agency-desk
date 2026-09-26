'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAgencyId } from '@/lib/auth';
import { getTasks, getProject, type Task, type Project } from '@/lib/api';
import TaskModal from '@/components/TaskModal';
import { ArrowLeft, Calendar } from 'lucide-react';

function priorityBadge(priority: string) {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-600';
    case 'medium': return 'bg-blue-100 text-blue-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'urgent': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'todo': return 'border-l-gray-300';
    case 'in_progress': return 'border-l-blue-400';
    case 'in_review': return 'border-l-yellow-400';
    case 'done': return 'border-l-green-400';
    default: return 'border-l-gray-300';
  }
}

export default function ClientProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const agencyId = getAgencyId();

  useEffect(() => {
    if (!agencyId) { router.push('/login'); return; }
    Promise.all([getTasks(agencyId, projectId), getProject(agencyId, projectId)])
      .then(([t, p]) => { setTasks(t); setProject(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agencyId, projectId, router]);

  const handleTaskUpdate = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/portal" className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{project?.name}</h1>
          <p className="text-sm text-gray-500">{tasks.length} tasks</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No tasks to show yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`w-full bg-white rounded-xl border border-gray-200 border-l-4 ${statusColor(task.status)} hover:shadow-sm transition-all p-4 text-left`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-400 mt-0.5 truncate">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {task.due_date && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due {new Date(task.due_date).toLocaleDateString()}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          agencyId={agencyId}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}