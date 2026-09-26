'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getComments, addComment, getTimeEntries, logTime,
  getAttachments, uploadAttachment, setApproval, updateTask,
  type Task, type Comment, type TimeEntry, type Attachment
} from '@/lib/api';
import { isClientUser } from '@/lib/auth';
import { X, Send, Clock, Paperclip, CheckCircle, XCircle, Upload, Lock } from 'lucide-react';

interface TaskModalProps {
  task: Task;
  agencyId: string;
  onClose: () => void;
  onTaskUpdate: (updated: Task) => void;
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

function approvalColor(status: string) {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-700';
    case 'needs_changes': return 'bg-red-100 text-red-700';
    default: return 'bg-yellow-100 text-yellow-700';
  }
}

export default function TaskModal({ task, agencyId, onClose, onTaskUpdate }: TaskModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'files' | 'time'>('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeNote, setTimeNote] = useState('');
  const [timeDate, setTimeDate] = useState(new Date().toISOString().slice(0, 10));
  const [editStatus, setEditStatus] = useState(task.status);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editInternal, setEditInternal] = useState(task.is_internal);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isClient = isClientUser();

  useEffect(() => {
    getComments(agencyId, task.id).then(setComments).catch(() => {});
    getAttachments(agencyId, task.id).then(setAttachments).catch(() => {});
    if (!isClient) {
      getTimeEntries(agencyId, task.id.split('/')[0]).then(setTimeEntries).catch(() => {});
    }
  }, [agencyId, task.id, isClient]);

  const postComment = async () => {
    if (!newComment.trim()) return;
    const c = await addComment(agencyId, task.id, newComment, isInternal && !isClient);
    setComments((prev) => [...prev, c]);
    setNewComment('');
  };

  const handleLogTime = async () => {
    if (!timeMinutes) return;
    const entry = await logTime(agencyId, task.id, {
      duration_minutes: parseInt(timeMinutes),
      note: timeNote || undefined,
      date: timeDate,
    });
    setTimeEntries((prev) => [...prev, entry]);
    setTimeMinutes(''); setTimeNote('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const a = await uploadAttachment(agencyId, task.id, file, editInternal);
    setAttachments((prev) => [...prev, a]);
  };

  const handleApproval = async (attachmentId: string, status: 'approved' | 'needs_changes') => {
    const updated = await setApproval(agencyId, attachmentId, status);
    setAttachments((prev) => prev.map((a) => (a.id === attachmentId ? updated : a)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateTask(agencyId, task.id, {
        title: editTitle,
        status: editStatus,
        priority: editPriority,
        is_internal: editInternal,
      });
      onTaskUpdate(updated);
    } finally {
      setSaving(false);
    }
  };

  const tabs = isClient
    ? [{ key: 'comments', label: 'Comments' }, { key: 'files', label: 'Files' }]
    : [{ key: 'details', label: 'Details' }, { key: 'comments', label: 'Comments' }, { key: 'files', label: 'Files' }, { key: 'time', label: 'Time' }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {task.is_internal && (
                <span className="flex items-center gap-1 text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Internal
                </span>
              )}
              <h2 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg ml-4 flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* DETAILS TAB */}
          {activeTab === 'details' && !isClient && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as Task['status'])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Task['priority'])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="internal"
                  checked={editInternal}
                  onChange={(e) => setEditInternal(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="internal" className="text-sm text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-500" />
                  Mark as Internal (hidden from clients)
                </label>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className={`rounded-lg p-3 ${c.is_internal ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                  {c.is_internal && (
                    <span className="text-xs text-purple-600 font-medium flex items-center gap-1 mb-1">
                      <Lock className="w-3 h-3" /> Internal
                    </span>
                  )}
                  <p className="text-sm text-gray-800">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                </div>
              ))}
              <div className="border-t pt-4 space-y-2">
                {!isClient && (
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Internal comment
                  </label>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment…"
                    rows={2}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={postComment}
                    className="self-end bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FILES TAB */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              {!isClient && (
                <div>
                  <input type="file" ref={fileRef} className="hidden" onChange={handleFileUpload} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 text-sm font-medium rounded-lg px-4 py-3 w-full transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload File
                  </button>
                </div>
              )}
              {attachments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No files attached.</p>
              )}
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-800 truncate">{a.filename}</span>
                    {a.is_internal && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Internal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${approvalColor(a.approval_status)}`}>
                      {a.approval_status.replace('_', ' ')}
                    </span>
                    {isClient && a.approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproval(a.id, 'approved')}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApproval(a.id, 'needs_changes')}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Needs Changes"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TIME TAB (agency only) */}
          {activeTab === 'time' && !isClient && (
            <div className="space-y-4">
              {timeEntries.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">No time logged yet.</p>
              )}
              {timeEntries.map((t) => (
                <div key={t.id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{t.duration_minutes} min</span>
                      {t.note && <span className="text-gray-500"> — {t.note}</span>}
                    </p>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Log Time</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                    <input
                      type="number"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                      placeholder="e.g. 90"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={timeDate}
                      onChange={(e) => setTimeDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <input
                  value={timeNote}
                  onChange={(e) => setTimeNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleLogTime}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Log Time
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
