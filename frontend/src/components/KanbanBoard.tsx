'use client';

import { useState } from 'react';
import { type Task } from '@/lib/api';
import { Lock, Calendar } from 'lucide-react';
import TaskModal from './TaskModal';

interface KanbanBoardProps {
  tasks: Task[];
  agencyId: string;
  onTasksChange: (tasks: Task[]) => void;
}

const COLUMNS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'todo', label: 'Todo', color: 'border-gray-300' },
  { key: 'in_progress', label: 'In Progress', color: 'border-blue-400' },
  { key: 'in_review', label: 'In Review', color: 'border-yellow-400' },
  { key: 'done', label: 'Done', color: 'border-green-400' },
];

function priorityBadge(priority: string) {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-600';
    case 'medium': return 'bg-blue-100 text-blue-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'urgent': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function KanbanBoard({ tasks, agencyId, onTasksChange }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleTaskUpdate = (updated: Task) => {
    onTasksChange(tasks.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="flex flex-col gap-2">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 bg-white rounded-lg border-l-4 ${col.color} shadow-sm`}>
                <span className="font-semibold text-sm text-gray-700">{col.label}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {colTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md p-3 text-left transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
                        {task.title}
                      </p>
                      {task.is_internal && (
                        <Lock className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${priorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.is_internal && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                          Internal
                        </span>
                      )}
                    </div>

                    {task.due_date && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          agencyId={agencyId}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </>
  );
}
