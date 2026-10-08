import {
  User,
  SecurityEvent,
  Incident,
  IncidentDetail,
  Policy,
  AnalyticsOverview,
  AnalyticsTrends,
  IncidentStatus,
} from '../types';

const BASE_URL = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('shadow_ai_token');
}

export function setToken(token: string): void {
  localStorage.setItem('shadow_ai_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('shadow_ai_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== '/login') {
      // Allow caller to handle
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<{ user: User }>('/auth/me'),
  },

  events: {
    list: (page = 1, limit = 20) =>
      request<{ events: SecurityEvent[]; pagination: { total: number; page: number; pages: number } }>(
        `/events?page=${page}&limit=${limit}`
      ),
    getById: (id: string) => request<any>(`/events/${id}`),
    scan: (prompt_text: string) =>
      request<any>('/events/scan', {
        method: 'POST',
        body: JSON.stringify({ prompt_text }),
      }),
    ingest: (payload: {
      user_identifier: string;
      device_info: { hostname: string; ip_address: string; os?: string; department?: string };
      ai_service: string;
      destination_url?: string;
      prompt_text: string;
    }) =>
      request<any>('/events/ingest', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  incidents: {
    list: (params?: { status?: string; severity?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.severity) q.append('severity', params.severity);
      return request<{ incidents: Incident[] }>(`/incidents?${q.toString()}`);
    },
    getById: (id: string) => request<IncidentDetail>(`/incidents/${id}`),
    updateStatus: (id: string, status: IncidentStatus, notes?: string) =>
      request<any>(`/incidents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    triggerAI: (id: string) =>
      request<any>(`/incidents/${id}/ai-analyze`, {
        method: 'POST',
      }),
  },

  policies: {
    list: () => request<{ policies: Policy[] }>('/policies'),
    update: (id: string, payload: Partial<Policy>) =>
      request<any>(`/policies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  risk: {
    getWeights: () => request<any>('/risk/weights'),
    updateWeights: (payload: any) =>
      request<any>('/risk/weights', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  analytics: {
    getOverview: () => request<{ overview: AnalyticsOverview }>('/analytics/overview'),
    getTrends: () => request<{ trends: AnalyticsTrends }>('/analytics/trends'),
  },
};
