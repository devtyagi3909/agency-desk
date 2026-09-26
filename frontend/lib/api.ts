import axios from 'axios';
import { getTokens, setTokens, clearTokens } from './auth';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const { accessToken } = getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { refreshToken } = getTokens();
        if (!refreshToken) throw new Error('No refresh token');
        
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        const { access_token, refresh_token, role, agency_id } = res.data;
        setTokens(access_token, refresh_token, role, agency_id);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data: any) => api.post('/auth/login', data).then(res => res.data);
export const register = (data: any) => api.post('/auth/register', data).then(res => res.data);

// Projects
export const getProjects = (agencyId: string) => api.get(`/projects/${agencyId}`).then(res => res.data);
export const getProject = (agencyId: string, projectId: string) => api.get(`/projects/${agencyId}/${projectId}`).then(res => res.data);
export const createProject = (agencyId: string, data: any) => api.post(`/projects/${agencyId}`, data).then(res => res.data);

// Tasks
export const getTasks = (agencyId: string, projectId: string) => api.get(`/tasks/${agencyId}/projects/${projectId}/tasks`).then(res => res.data);
export const createTask = (agencyId: string, projectId: string, data: any) => api.post(`/tasks/${agencyId}/projects/${projectId}/tasks`, data).then(res => res.data);
export const updateTask = (agencyId: string, taskId: string, data: any) => api.patch(`/tasks/${agencyId}/tasks/${taskId}`, data).then(res => res.data);

// Comments
export const getComments = (agencyId: string, taskId: string) => api.get(`/comments/${agencyId}/tasks/${taskId}/comments`).then(res => res.data);
export const addComment = (agencyId: string, taskId: string, data: any) => api.post(`/comments/${agencyId}/tasks/${taskId}/comments`, data).then(res => res.data);

// Time Entries
export const getTimeEntries = (agencyId: string, projectId: string) => api.get(`/time_entries/${agencyId}/projects/${projectId}/time-entries`).then(res => res.data);
export const logTime = (agencyId: string, taskId: string, data: any) => api.post(`/time_entries/${agencyId}/tasks/${taskId}/time-entries`, data).then(res => res.data);

// Attachments
export const getAttachments = (agencyId: string, taskId: string) => api.get(`/attachments/${agencyId}/tasks/${taskId}/attachments`).then(res => res.data);
export const uploadAttachment = (agencyId: string, taskId: string, data: FormData) => api.post(`/attachments/${agencyId}/tasks/${taskId}/attachments`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(res => res.data);
export const updateAttachmentApproval = (agencyId: string, attachmentId: string, status: string) => api.patch(`/attachments/${agencyId}/attachments/${attachmentId}/approval`, { status }).then(res => res.data);

// Invitations
export const sendInvite = (agencyId: string, data: any) => api.post(`/invitations/${agencyId}`, data).then(res => res.data);
export const acceptInvite = (data: any) => api.post(`/invitations/accept`, data).then(res => res.data);

// Dashboard
export const getDashboardStats = (agencyId: string, projectId: string) => api.get(`/dashboard/${agencyId}/projects/${projectId}/dashboard`).then(res => res.data);

// Clients
export const getClients = (agencyId: string) => api.get(`/clients/${agencyId}`).then(res => res.data);
export const createClient = (agencyId: string, data: any) => api.post(`/clients/${agencyId}`, data).then(res => res.data);
