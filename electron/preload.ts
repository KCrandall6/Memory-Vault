// electron/preload.ts - cleaned version
import { contextBridge, ipcRenderer } from 'electron'

// Define TypeScript interfaces for ElectronAPI
interface ElectronAPI {
  selectFiles: () => Promise<any[]>;
  saveMedia: (data: any) => Promise<{ success: boolean; mediaId?: number; error?: string }>;
  getFilePreview: (filePath: string) => Promise<{ dataUrl: string; mimeType: string } | null>;
  getMediaTypes: () => Promise<any[]>;
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
  getFilePreview: (filePath) => ipcRenderer.invoke('get-file-preview', filePath),
  
  // Database operations
  getCollections: () => ipcRenderer.invoke('get-collections'),
  getTags: () => ipcRenderer.invoke('get-tags'),
  getPeople: () => ipcRenderer.invoke('get-people'),
  
  // Event listeners
  onMainProcessMessage: (callback) => {
    ipcRenderer.on('main-process-message', (_event, ...args) => callback(...args));
  }
} as ElectronAPI)