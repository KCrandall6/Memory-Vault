import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  selectFiles: () => ipcRenderer.invoke("select-files"),
  saveMedia: (data) => ipcRenderer.invoke("save-media", data),
  getFilePreview: (filePath) => ipcRenderer.invoke("get-file-preview", filePath),
  // Database operations
  getCollections: () => ipcRenderer.invoke("get-collections"),
  getTags: () => ipcRenderer.invoke("get-tags"),
  getPeople: () => ipcRenderer.invoke("get-people"),
  // Event listeners
  onMainProcessMessage: (callback) => {
    ipcRenderer.on("main-process-message", (_event, ...args) => callback(...args));
  }
});
//# sourceMappingURL=preload.js.map
