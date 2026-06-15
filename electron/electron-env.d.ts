/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

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

// Used in Renderer process, expose in `preload.ts`
interface Window {
  electronAPI: {
    selectFiles: () => Promise<any[]>;
    saveMedia: (data: any) => Promise<{ success: boolean; mediaId?: number; error?: string }>;
    getFilePreview: (filePath: string) => Promise<{ dataUrl: string; mimeType: string } | null>;
    getMediaTypes: () => Promise<any[]>;
    getSourceTypes?: () => Promise<any[]>;
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
    onMainProcessMessage: (callback: (...args: any[]) => void) => void;
  }
}