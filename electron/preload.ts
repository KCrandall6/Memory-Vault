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


type VaultPaths = {
  vaultRoot: string;
  databasePath: string;
  databaseFileName: string;
  archivePath: string;
  archiveFolderName: string;
};

type VaultHealthStatus = 'healthy' | 'needs_attention' | 'missing' | 'unknown';

type VaultHealthSummary = {
  paths: VaultPaths;
  health: {
    status: VaultHealthStatus;
    vaultRoot: VaultHealthStatus;
    databaseFile: VaultHealthStatus;
    archiveFolder: VaultHealthStatus;
    databaseConnection: VaultHealthStatus;
    warnings: string[];
  };
  storage: {
    archiveSizeBytes: number;
    databaseSizeBytes: number;
    diskFreeBytes: number | null;
    diskTotalBytes: number | null;
    diskUsedBytes: number | null;
    diskUsedPercent: number | null;
  };
  totals: {
    totalMemories: number;
    images: number;
    documents: number;
    videos: number;
    audio: number;
    collections: number;
    people: number;
    tags: number;
  };
  error?: string;
  integrity: {
    missingFilesCount: number;
    orphanFilesCount: number;
    missingFiles: Array<{ id?: number; title?: string | null; fileName: string; filePath: string; mediaType?: string | null }>;
    orphanFiles: Array<{ fileName: string; filePath: string; size: number }>;
  };
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
  getCollectionSummaries: () => Promise<any[]>;
  getCollectionMedia: (collectionId: number | string) => Promise<any[]>;
  getPeopleSummaries: () => Promise<any[]>;
  getPersonMedia: (personId: number) => Promise<any[]>;
  getTagSummaries: () => Promise<any[]>;
  getTagMedia: (tagId: number) => Promise<any[]>;
  getDateSummaries: () => Promise<any[]>;
  getDateMedia: (year: string) => Promise<any[]>;
  updateCollectionDetails: (payload: { id: number; name: string; description?: string }) => Promise<{ success: boolean; collection?: any; error?: string }>;
  deleteCollection: (id: number) => Promise<{ success: boolean; blocked?: boolean; mediaCount?: number; error?: string }>;
  deleteMedia: (id: number) => Promise<{ success: boolean; error?: string }>;
  getMediaDetails: (id: number) => Promise<any | null>;
  updateMediaDetails: (payload: any) => Promise<{ success: boolean; media?: any; error?: string }>;
  downloadMediaFile: (payload: { filePath: string; defaultFileName?: string }) =>
    Promise<{ success: boolean } | { success: boolean; canceled: boolean }>;
  getVaultSettings: () => Promise<VaultPaths>;
  openVaultFolder: () => Promise<{ success: boolean; error?: string }>;
  openArchiveFolder: () => Promise<{ success: boolean; error?: string }>;
  getVaultHealth: () => Promise<VaultHealthSummary>;
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
  getCollectionSummaries: () => ipcRenderer.invoke('get-collection-summaries'),
  getCollectionMedia: (collectionId) => ipcRenderer.invoke('get-collection-media', collectionId),
  getPeopleSummaries: () => ipcRenderer.invoke('get-people-summaries'),
  getPersonMedia: (personId) => ipcRenderer.invoke('get-person-media', personId),
  getTagSummaries: () => ipcRenderer.invoke('get-tag-summaries'),
  getTagMedia: (tagId) => ipcRenderer.invoke('get-tag-media', tagId),
  getDateSummaries: () => ipcRenderer.invoke('get-date-summaries'),
  getDateMedia: (year) => ipcRenderer.invoke('get-date-media', year),
  updateCollectionDetails: (payload) => ipcRenderer.invoke('update-collection-details', payload),
  deleteCollection: (id) => ipcRenderer.invoke('delete-collection', id),
  deleteMedia: (id) => ipcRenderer.invoke('delete-media', id),
  getMediaDetails: (id) => ipcRenderer.invoke('get-media-details', id),
  updateMediaDetails: (payload) => ipcRenderer.invoke('update-media-details', payload),
  downloadMediaFile: (payload) => ipcRenderer.invoke('download-media-file', payload),
  getVaultSettings: () => ipcRenderer.invoke('get-vault-settings'),
  openVaultFolder: () => ipcRenderer.invoke('open-vault-folder'),
  openArchiveFolder: () => ipcRenderer.invoke('open-archive-folder'),
  getVaultHealth: () => ipcRenderer.invoke('get-vault-health'),
  onMainProcessMessage: (callback) => {
    ipcRenderer.on('main-process-message', (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args));
  },
} as ElectronAPI);