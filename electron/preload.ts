// electron/preload.ts - for on-the-fly thumbnails

import { contextBridge, ipcRenderer } from 'electron'

// Define TypeScript interfaces for ElectronAPI
interface ElectronAPI {
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

// Expose validated APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  saveMedia: (data) => ipcRenderer.invoke('save-media', data),
  getThumbnail: (filePath) => ipcRenderer.invoke('get-thumbnail', filePath),
  
  // Database operations
  getMediaTypes: () => ipcRenderer.invoke('get-media-types'),
  getSourceTypes: () => ipcRenderer.invoke('get-source-types'),
  getCollections: () => ipcRenderer.invoke('get-collections'),
  getTags: () => ipcRenderer.invoke('get-tags'),
  getPeople: () => ipcRenderer.invoke('get-people'),
  
  // Event listeners
  onMainProcessMessage: (callback) => {
    ipcRenderer.on('main-process-message', (_event, ...args) => callback(...args));
  }
} as ElectronAPI)