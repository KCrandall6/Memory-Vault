import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  selectFiles: () => ipcRenderer.invoke("select-files"),
  saveMedia: (data) => ipcRenderer.invoke("save-media", data),
  getThumbnail: (filePath) => ipcRenderer.invoke("get-thumbnail", filePath),
  // Database operations
  getMediaTypes: () => ipcRenderer.invoke("get-media-types"),
  getSourceTypes: () => ipcRenderer.invoke("get-source-types"),
  getCollections: () => ipcRenderer.invoke("get-collections"),
  getTags: () => ipcRenderer.invoke("get-tags"),
  getPeople: () => ipcRenderer.invoke("get-people"),
  // Event listeners
  onMainProcessMessage: (callback) => {
    ipcRenderer.on("main-process-message", (_event, ...args) => callback(...args));
  }
});
//# sourceMappingURL=preload.js.map
