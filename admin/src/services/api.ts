import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.UMI_APP_API_BASE || 'http://localhost:3001/api',
  timeout: 120000,
});

export type AccountRecord = {
  id: number;
  name: string;
  usernameEncrypted: string;
  usernamePreview: string;
  remark?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LogRecord = {
  id: number;
  action: string;
  success: boolean;
  message?: string;
  targetUrl?: string;
  createdAt: string;
  account?: {
    id: number;
    name: string;
  };
};

export type FavoriteResult = {
  accountId: number;
  accountName: string;
  status: string;
  error?: string;
};

export async function fetchAccounts() {
  const response = await apiClient.get<AccountRecord[]>('/accounts');
  return response.data;
}

export async function createAccount(payload: Record<string, unknown>) {
  const response = await apiClient.post<AccountRecord>('/accounts', payload);
  return response.data;
}

export async function updateAccount(id: number, payload: Record<string, unknown>) {
  const response = await apiClient.patch<AccountRecord>(`/accounts/${id}`, payload);
  return response.data;
}

export async function deleteAccount(id: number) {
  const response = await apiClient.delete<{ success: boolean }>(`/accounts/${id}`);
  return response.data;
}

export async function runFavorite(payload: {
  url: string;
  accountIds?: number[];
  headless?: boolean;
}) {
  const response = await apiClient.post<{
    ok: boolean;
    url: string;
    results: FavoriteResult[];
  }>('/automation/favorite', payload);
  return response.data;
}

export async function fetchLogs(limit = 50) {
  const response = await apiClient.get<LogRecord[]>('/logs', {
    params: { limit },
  });
  return response.data;
}
