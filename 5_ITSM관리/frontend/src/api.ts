import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export interface Column {
  name: string;
  label: string;
}

export interface DomainSummary {
  key: string;
  title: string;
  folder: string;
  idField: string;
  titleField: string;
  icon: string;
  count: number;
}

export interface DomainDetail {
  meta: {
    key: string;
    title: string;
    folder: string;
    idField: string;
    titleField: string;
    icon: string;
  };
  columns: Column[];
  rows: Record<string, string>[];
}

export interface DashboardData {
  kpis: {
    totalAssets: number;
    change: number;
    incident: number;
    problem: number;
    ciAdded: number;
    ciRemoved: number;
  };
  category: { category: string; label: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  domainCounts: { key: string; title: string; icon: string; count: number }[];
  recentChanges: Record<string, string>[];
}

export interface HistoryData {
  columns: Column[];
  rows: Record<string, string>[];
}

export const getDomains = () => api.get<DomainSummary[]>("/domains").then((r) => r.data);
export const getDomain = (key: string) => api.get<DomainDetail>(`/domains/${key}`).then((r) => r.data);
export const createRow = (key: string, values: Record<string, string>) =>
  api.post(`/domains/${key}/rows`, { values }).then((r) => r.data);
export const deleteRow = (key: string, id: string) =>
  api.delete(`/domains/${key}/rows/${encodeURIComponent(id)}`).then((r) => r.data);
export const getHistory = (key: string) => api.get<HistoryData>(`/domains/${key}/history`).then((r) => r.data);
export const getDashboard = () => api.get<DashboardData>("/dashboard").then((r) => r.data);
export const getErd = () => api.get<{ logical: string; physical: string }>("/erd").then((r) => r.data);
export const unlockManagement = (password: string) =>
  api.post("/management/unlock", { password }).then((r) => r.data);
export const pdfUrl = (subdir: string, name: string) =>
  `/api/management/pdf?subdir=${encodeURIComponent(subdir)}&name=${encodeURIComponent(name)}`;

export default api;
