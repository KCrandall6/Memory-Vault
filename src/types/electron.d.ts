// src/types/electron.d.ts - Create this file

interface ElectronAPI {
    selectFiles: () => Promise<any[]>;
    saveMedia: (data: any) => Promise<{ success: boolean; mediaId?: number; error?: string }>;
    getMediaTypes: () => Promise<any[]>;
    getSourceTypes: () => Promise<any[]>;
    getCollections: () => Promise<any[]>;
    getTags: () => Promise<any[]>;
    getPeople: () => Promise<any[]>;
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  }
  
  export {};