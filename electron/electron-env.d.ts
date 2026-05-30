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
    getMediaDetails: (id: number) => Promise<any | null>;
    updateMediaDetails: (payload: any) => Promise<{ success: boolean; media?: any; error?: string }>;
    downloadMediaFile: (payload: { filePath: string; defaultFileName?: string }) =>
      Promise<{ success: boolean } | { success: boolean; canceled: boolean }>;
    onMainProcessMessage: (callback: (...args: any[]) => void) => void;
  }
}