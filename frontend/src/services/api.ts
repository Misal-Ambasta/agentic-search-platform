import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DriveFolder {
  id: string;
  name: string;
}

export interface AgentSession {
  id: string;
  task: string;
  plan: any[];
  history: any[];
  observations: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

export const apiService = {
  // Auth
  getAuthUrl: async () => {
    const response = await api.get('/auth/google');
    return response.data.url;
  },

  confirmAuth: async (code: string) => {
    const response = await api.get(`/auth/callback?code=${code}`);
    return response.data;
  },

  checkAuthStatus: async () => {
    const response = await api.get('/auth/status');
    return response.data as { isConnected: boolean };
  },

  disconnect: async () => {
    const response = await api.post('/auth/disconnect');
    return response.data;
  },

  getDriveFolders: async () => {
    const response = await api.get('/drive/folders');
    return response.data.folders as DriveFolder[];
  },

  // Ingestion
  triggerIngestion: async (folderId: string) => {
    const response = await api.post('/drive/ingest', { folderId });
    return response.data;
  },

  // Agent
  startAgent: async (task: string) => {
    const response = await api.post('/agent/start', { task });
    return response.data as { sessionId: string };
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/agent/${sessionId}`);
    return response.data as AgentSession;
  },
};

export default api;
