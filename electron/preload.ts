// electron/preload.ts - cleaned version
import type { IpcRendererEvent } from 'electron';

// Sandboxed Electron preload scripts must load Electron through CommonJS at runtime.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer }: typeof import('electron') = require('electron');

type DashboardSummary = {
  totalMedia: number;
  collectionsCount: number;
  peopleCount: number;
  tagsCount: number;
  mediaTypeCounts: Record<string, number>;
};


type VaultPaths = {
  vaultRoot: string;
  libraryPath: string;
  settingsPath: string;
  settingsFileName: string;
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


type ReferenceRecord = { id: number; name: string; [key: string]: unknown };
type MediaFileSelection = File | { name: string; path: string; type?: string; size?: number; [key: string]: unknown };
type MediaRecord = Record<string, unknown>;
type SearchCriteria = Record<string, unknown>;
type SaveMediaPayload = Record<string, unknown>;
type UpdateMediaPayload = { id: number | string; [key: string]: unknown };

type MemoryNote = {
  id: number;
  media_id: number;
  author_name?: string | null;
  content: string;
  created_at: string;
};

type VaultCopyResult = {
  success: boolean;
  destinationPath?: string;
  copiedFileCount?: number;
  totalBytesCopied?: number;
  canceled?: boolean;
  error?: string;
};

type LibraryStatus = { configured: boolean; activeLibraryPath: string | null; paths: VaultPaths | null };

interface ElectronAPI {
  getLibraryStatus: () => Promise<LibraryStatus>;
  chooseCreateNewLibrary: () => Promise<{ success: boolean; canceled?: boolean; paths?: VaultPaths; error?: string }>;
  chooseOpenExistingLibrary: () => Promise<{ success: boolean; canceled?: boolean; paths?: VaultPaths; error?: string }>;
  getLibraryPaths: () => Promise<VaultPaths>;
  selectFiles: () => Promise<MediaFileSelection[]>;
  saveMedia: (data: SaveMediaPayload) => Promise<{ success: boolean; mediaId?: number; error?: string }>;
  getFilePreview: (filePath: string) => Promise<{ dataUrl: string; mimeType: string } | null>;
  getMediaTypes: () => Promise<ReferenceRecord[]>;
  getCollections: () => Promise<ReferenceRecord[]>;
  getTags: () => Promise<ReferenceRecord[]>;
  getPeople: () => Promise<ReferenceRecord[]>;
  searchMedia: (criteria: SearchCriteria) => Promise<MediaRecord[]>;
  getDashboardSummary: () => Promise<DashboardSummary>;
  getCollectionSummaries: () => Promise<MediaRecord[]>;
  getCollectionMedia: (collectionId: number | string) => Promise<MediaRecord[]>;
  getPeopleSummaries: () => Promise<MediaRecord[]>;
  getPersonMedia: (personId: number) => Promise<MediaRecord[]>;
  getTagSummaries: () => Promise<MediaRecord[]>;
  getTagMedia: (tagId: number) => Promise<MediaRecord[]>;
  getDateSummaries: () => Promise<MediaRecord[]>;
  getDateMedia: (year: string) => Promise<MediaRecord[]>;
  updateCollectionDetails: (payload: { id: number; name: string; description?: string }) => Promise<{ success: boolean; collection?: MediaRecord; error?: string }>;
  deleteCollection: (id: number) => Promise<{ success: boolean; blocked?: boolean; mediaCount?: number; error?: string }>;
  deleteMedia: (id: number) => Promise<{ success: boolean; error?: string }>;
  getMediaDetails: (id: number) => Promise<MediaRecord | null>;
  updateMediaDetails: (payload: UpdateMediaPayload) => Promise<{ success: boolean; media?: MediaRecord; error?: string }>;
  getMemoryNotes: (mediaId: number) => Promise<MemoryNote[]>;
  addMemoryNote: (mediaId: number, payload: { authorName?: string; content: string }) => Promise<{ success: boolean; note?: MemoryNote; error?: string }>;
  downloadMediaFile: (payload: { filePath: string; defaultFileName?: string }) =>
    Promise<{ success: boolean } | { success: boolean; canceled: boolean }>;
  getVaultSettings: () => Promise<VaultPaths>;
  openVaultFolder: () => Promise<{ success: boolean; error?: string }>;
  openArchiveFolder: () => Promise<{ success: boolean; error?: string }>;
  getVaultHealth: () => Promise<VaultHealthSummary>;
  createVaultBackup: () => Promise<VaultCopyResult>;
  createVaultShareableCopy: () => Promise<VaultCopyResult>;
  openVaultOutputFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  onMainProcessMessage: (callback: (...args: unknown[]) => void) => void;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getLibraryStatus: () => ipcRenderer.invoke('get-library-status'),
  chooseCreateNewLibrary: () => ipcRenderer.invoke('choose-create-new-library'),
  chooseOpenExistingLibrary: () => ipcRenderer.invoke('choose-open-existing-library'),
  getLibraryPaths: () => ipcRenderer.invoke('get-library-paths'),
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
  getMemoryNotes: (mediaId) => ipcRenderer.invoke('get-memory-notes', mediaId),
  addMemoryNote: (mediaId, payload) => ipcRenderer.invoke('add-memory-note', mediaId, payload),
  downloadMediaFile: (payload) => ipcRenderer.invoke('download-media-file', payload),
  getVaultSettings: () => ipcRenderer.invoke('get-vault-settings'),
  openVaultFolder: () => ipcRenderer.invoke('open-vault-folder'),
  openArchiveFolder: () => ipcRenderer.invoke('open-archive-folder'),
  getVaultHealth: () => ipcRenderer.invoke('get-vault-health'),
  createVaultBackup: () => ipcRenderer.invoke('create-vault-backup'),
  createVaultShareableCopy: () => ipcRenderer.invoke('create-vault-shareable-copy'),
  openVaultOutputFolder: (folderPath) => ipcRenderer.invoke('open-vault-output-folder', folderPath),
  onMainProcessMessage: (callback) => {
    ipcRenderer.on('main-process-message', (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args));
  },
} as ElectronAPI);