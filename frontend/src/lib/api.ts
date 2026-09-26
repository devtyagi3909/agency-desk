import axios from "axios";
import { clearTokens, getTokens, setTokens } from "./auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE_URL });

// Attach access token to every request
api.interceptors.request.use((config) => {
  const { accessToken } = getTokens();
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// On 401 try refresh, otherwise redirect to login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = getTokens();
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const newAccess = res.data.access_token;
        setTokens(newAccess, refreshToken, typeof window !== "undefined" ? localStorage.getItem("role") ?? "" : "", typeof window !== "undefined" ? localStorage.getItem("agency_id") ?? "" : "");
        original.headers["Authorization"] = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
  agency_slug: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  role: string;
  agency_id?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  client_id: string;
  agency_id: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  is_internal: boolean;
  assignee_membership_id: string | null;
  due_date: string | null;
  project_id: string;
  agency_id: string;
}

export interface Comment {
  id: string;
  content: string;
  is_internal: boolean;
  author_membership_id: string;
  task_id: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  duration_minutes: number;
  note: string | null;
  date: string;
  task_id: string;
  membership_id: string;
}

export interface Attachment {
  id: string;
  filename: string;
  is_internal: boolean;
  approval_status: "pending" | "approved" | "needs_changes";
  task_id: string;
  uploaded_by_membership_id: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  agency_id: string;
}

export interface DashboardStats {
  task_counts_by_status: Record<string, number>;
  total_hours: number;
  pending_approvals: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/login", payload);
  return res.data;
}

export async function register(payload: {
  email: string;
  password: string;
  full_name: string;
}): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/register", payload);
  return res.data;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(agencyId: string): Promise<Project[]> {
  const res = await api.get<Project[]>(`/projects/${agencyId}`);
  return res.data;
}

export async function getProject(agencyId: string, projectId: string): Promise<Project> {
  const res = await api.get<Project>(`/projects/${agencyId}/${projectId}`);
  return res.data;
}

export async function createProject(
  agencyId: string,
  data: { name: string; description: string; client_id: string }
): Promise<Project> {
  const res = await api.post<Project>(`/projects/${agencyId}`, data);
  return res.data;
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function getClients(agencyId: string): Promise<Client[]> {
  const res = await api.get<Client[]>(`/clients/${agencyId}`);
  return res.data;
}

export async function createClient(
  agencyId: string,
  data: { name: string; email: string }
): Promise<Client> {
  const res = await api.post<Client>(`/clients/${agencyId}`, data);
  return res.data;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(agencyId: string, projectId: string): Promise<Task[]> {
  const res = await api.get<Task[]>(`/tasks/${agencyId}/projects/${projectId}/tasks`);
  return res.data;
}

export async function createTask(
  agencyId: string,
  projectId: string,
  data: {
    title: string;
    description: string;
    priority: string;
    is_internal?: boolean;
    due_date?: string;
  }
): Promise<Task> {
  const res = await api.post<Task>(
    `/tasks/${agencyId}/projects/${projectId}/tasks`,
    data
  );
  return res.data;
}

export async function updateTask(
  agencyId: string,
  taskId: string,
  data: Partial<Task>
): Promise<Task> {
  const res = await api.patch<Task>(`/tasks/${agencyId}/tasks/${taskId}`, data);
  return res.data;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function getComments(agencyId: string, taskId: string): Promise<Comment[]> {
  const res = await api.get<Comment[]>(`/comments/${agencyId}/tasks/${taskId}/comments`);
  return res.data;
}

export async function addComment(
  agencyId: string,
  taskId: string,
  content: string,
  is_internal = false
): Promise<Comment> {
  const res = await api.post<Comment>(
    `/comments/${agencyId}/tasks/${taskId}/comments`,
    { content, is_internal }
  );
  return res.data;
}

// ─── Time Entries ─────────────────────────────────────────────────────────────

export async function getTimeEntries(agencyId: string, projectId: string): Promise<TimeEntry[]> {
  const res = await api.get<TimeEntry[]>(
    `/time_entries/${agencyId}/projects/${projectId}/time-entries`
  );
  return res.data;
}

export async function logTime(
  agencyId: string,
  taskId: string,
  data: { duration_minutes: number; note?: string; date: string }
): Promise<TimeEntry> {
  const res = await api.post<TimeEntry>(
    `/time_entries/${agencyId}/tasks/${taskId}/time-entries`,
    data
  );
  return res.data;
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export async function getAttachments(agencyId: string, taskId: string): Promise<Attachment[]> {
  const res = await api.get<Attachment[]>(
    `/attachments/${agencyId}/tasks/${taskId}/attachments`
  );
  return res.data;
}

export async function uploadAttachment(
  agencyId: string,
  taskId: string,
  file: File,
  is_internal: boolean
): Promise<Attachment> {
  const form = new FormData();
  form.append("file", file);
  form.append("is_internal", String(is_internal));
  const res = await api.post<Attachment>(
    `/attachments/${agencyId}/tasks/${taskId}/attachments`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function setApproval(
  agencyId: string,
  attachmentId: string,
  approval_status: "approved" | "needs_changes"
): Promise<Attachment> {
  const res = await api.patch<Attachment>(
    `/attachments/${agencyId}/attachments/${attachmentId}/approval`,
    { approval_status }
  );
  return res.data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(
  agencyId: string,
  projectId: string
): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>(
    `/dashboard/${agencyId}/projects/${projectId}/dashboard`
  );
  return res.data;
}

// ─── Invitations ─────────────────────────────────────────────────────────────

export async function sendInvite(
  agencyId: string,
  email: string,
  role: string
): Promise<void> {
  await api.post(`/invitations/${agencyId}`, { email, role });
}
