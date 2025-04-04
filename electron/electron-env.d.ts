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

// Used in Renderer process, expose in `preload.ts`
interface Window {
  electronAPI: {
    selectFiles: () => Promise<any[]>;
    saveMedia: (data: any) => Promise<{ success: boolean; mediaId?: number; error?: string }>;
    getThumbnail: (filePath: string) => Promise<{ thumbnailPath: string; thumbnailFileName: string } | null>;
    getMediaTypes: () => Promise<any[]>;
    getSourceTypes: () => Promise<any[]>;
    getCollections: () => Promise<any[]>;
    getTags: () => Promise<any[]>;
    getPeople: () => Promise<any[]>;
    onMainProcessMessage: (callback: (...args: any[]) => void) => void;
  }
}