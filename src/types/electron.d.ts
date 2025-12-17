// src/types/electron.d.ts - Create this file

interface ElectronAPI {
    selectFiles: () => Promise<any[]>;
    saveMedia: (data: any) => Promise<{ success: boolean; mediaId?: number; error?: string }>;
    getMediaTypes: () => Promise<any[]>;
    getSourceTypes: () => Promise<any[]>;
    getCollections: () => Promise<any[]>;
    getTags: () => Promise<any[]>;
    getPeople: () => Promise<any[]>;
    searchMedia: (criteria: any) => Promise<any[]>;
    getMediaDetails: (id: number) => Promise<any | null>;
    updateMediaDetails: (payload: any) => Promise<{ success: boolean; media?: any; error?: string }>;
    downloadMediaFile: (payload: { filePath: string; defaultFileName?: string }) => Promise<{ success: boolean } | { success: boolean; canceled: boolean }>;
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  }
  
  export {};