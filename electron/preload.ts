// electron/preload.ts - Update this file

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  saveMedia: (data) => ipcRenderer.invoke('save-media', data),
  
  // Database operations
  getMediaTypes: () => ipcRenderer.invoke('get-media-types'),
  getSourceTypes: () => ipcRenderer.invoke('get-source-types'),
  getCollections: () => ipcRenderer.invoke('get-collections'),
  getTags: () => ipcRenderer.invoke('get-tags'),
  getPeople: () => ipcRenderer.invoke('get-people'),
  
  // Other existing APIs...
})