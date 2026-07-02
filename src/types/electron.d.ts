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
  getMediaTypes: () => Promise<ReferenceRecord[]>;
  getSourceTypes?: () => Promise<ReferenceRecord[]>;
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
  getFilePreview?: (filePath: string) => Promise<{ dataUrl: string; mimeType: string } | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};