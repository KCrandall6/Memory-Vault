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
    downloadMediaFile: (payload: { filePath: string; defaultFileName?: string }) =>
      Promise<{ success: boolean } | { success: boolean; canceled: boolean }>;
    onMainProcessMessage: (callback: (...args: any[]) => void) => void;
  }
}