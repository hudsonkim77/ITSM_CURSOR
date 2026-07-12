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
  fks?: FkMeta[];
  maps?: MapMeta[];
}

export interface FkMeta {
  field: string;
  label: string;
  refDomain: string;
  optional: boolean;
}

export interface MapMeta {
  key: string;
  title: string;
  ownerField: string;
  relatedField: string;
  relatedDomain: string;
  extraFields: Column[];
}

export interface FkOption {
  id: string;
  label: string;
}

export interface MapData {
  meta: MapMeta;
  columns: Column[];
  rows: Record<string, string>[];
  relatedOptions: FkOption[];
}

export interface HistoryData {
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

export const getDomains = () => api.get<DomainSummary[]>("/domains").then((r) => r.data);
export const getDomain = (key: string) => api.get<DomainDetail>(`/domains/${key}`).then((r) => r.data);
export const createRow = (key: string, values: Record<string, string>) =>
  api.post(`/domains/${key}/rows`, { values }).then((r) => r.data);
export const updateRow = (key: string, id: string, values: Record<string, string>) =>
  api.put(`/domains/${key}/rows/${encodeURIComponent(id)}`, { values }).then((r) => r.data);
export const deleteRow = (key: string, id: string) =>
  api.delete(`/domains/${key}/rows/${encodeURIComponent(id)}`).then((r) => r.data);
export const getHistory = (key: string) => api.get<HistoryData>(`/domains/${key}/history`).then((r) => r.data);
export const getFkOptions = (key: string, excludeId = "") =>
  api
    .get<Record<string, FkOption[]>>(`/domains/${key}/fk-options`, { params: excludeId ? { excludeId } : {} })
    .then((r) => r.data);
export const getMapRows = (key: string, mapKey: string, ownerId: string) =>
  api
    .get<MapData>(`/domains/${key}/maps/${mapKey}`, { params: { ownerId } })
    .then((r) => r.data);
export const createMapRow = (
  key: string,
  mapKey: string,
  body: { ownerId: string; relatedId: string; values?: Record<string, string> },
) => api.post(`/domains/${key}/maps/${mapKey}/rows`, body).then((r) => r.data);
export const deleteMapRow = (key: string, mapKey: string, mapId: string) =>
  api.delete(`/domains/${key}/maps/${mapKey}/rows/${encodeURIComponent(mapId)}`).then((r) => r.data);
export const getDashboard = () => api.get<DashboardData>("/dashboard").then((r) => r.data);
export const getErd = () => api.get<{ logical: string; physical: string }>("/erd").then((r) => r.data);
export const unlockManagement = (password: string) =>
  api.post("/management/unlock", { password }).then((r) => r.data);
export const pdfUrl = (subdir: string, name: string) =>
  `/api/management/pdf?subdir=${encodeURIComponent(subdir)}&name=${encodeURIComponent(name)}`;

export default api;
