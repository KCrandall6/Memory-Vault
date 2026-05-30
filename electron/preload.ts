// electron/preload.ts - cleaned version
import type { IpcRendererEvent } from 'electron';
const { contextBridge, ipcRenderer } = require('electron');

type DashboardSummary = {
  totalMedia: number;
  collectionsCount: number;
  peopleCount: number;
  tagsCount: number;
  mediaTypeCounts: Record<string, number>;
};

interface ElectronAPI {
  selectFiles: () => Promise<any[]>;
  saveMedia: (data: any) => Promise<{ success: boolean; mediaId?: number; error?: string }>;
  getFilePreview: (filePath: string) => Promise<{ dataUrl: string; mimeType: string } | null>;
  getMediaTypes: () => Promise<any[]>;
  getCollections: () => Promise<any[]>;
  getTags: () => Promise<any[]>;
  getPeople: () => Promise<any[]>;
  searchMedia: (criteria: any) => Promise<any[]>;
  getDashboardSummary: () => Promise<DashboardSummary>;
  getMediaDetails: (id: number) => Promise<any | null>;
  updateMediaDetails: (payload: any) => Promise<{ success: boolean; media?: any; error?: string }>;
  downloadMediaFile: (payload: { filePath: string; defaultFileName?: string }) =>
    Promise<{ success: boolean } | { success: boolean; canceled: boolean }>;
  onMainProcessMessage: (callback: (...args: unknown[]) => void) => void;
}

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  saveMedia: (data) => ipcRenderer.invoke('save-media', data),
  getFilePreview: (filePath) => ipcRenderer.invoke('get-file-preview', filePath),
  getMediaTypes: () => ipcRenderer.invoke('get-media-types'),
  getCollections: () => ipcRenderer.invoke('get-collections'),
  getTags: () => ipcRenderer.invoke('get-tags'),
  getPeople: () => ipcRenderer.invoke('get-people'),
  searchMedia: (criteria) => ipcRenderer.invoke('search-media', criteria),
  getDashboardSummary: () => ipcRenderer.invoke('get-dashboard-summary'),
  getMediaDetails: (id) => ipcRenderer.invoke('get-media-details', id),
  updateMediaDetails: (payload) => ipcRenderer.invoke('update-media-details', payload),
  downloadMediaFile: (payload) => ipcRenderer.invoke('download-media-file', payload),
  onMainProcessMessage: (callback) => {
    ipcRenderer.on('main-process-message', (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args));
  },
} as ElectronAPI);