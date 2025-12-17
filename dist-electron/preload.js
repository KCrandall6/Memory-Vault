const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  selectFiles: () => ipcRenderer.invoke("select-files"),
  saveMedia: (data) => ipcRenderer.invoke("save-media", data),
  getFilePreview: (filePath) => ipcRenderer.invoke("get-file-preview", filePath),
  // Database operations
  getMediaTypes: () => ipcRenderer.invoke("get-media-types"),
  getCollections: () => ipcRenderer.invoke("get-collections"),
  getTags: () => ipcRenderer.invoke("get-tags"),
  getPeople: () => ipcRenderer.invoke("get-people"),
  searchMedia: (criteria) => ipcRenderer.invoke("search-media", criteria),
  getMediaDetails: (id) => ipcRenderer.invoke("get-media-details", id),
  updateMediaDetails: (payload) => ipcRenderer.invoke("update-media-details", payload),
  downloadMediaFile: (payload) => ipcRenderer.invoke("download-media-file", payload),
  // Event listeners
  onMainProcessMessage: (callback) => {
    ipcRenderer.on("main-process-message", (_event, ...args) => callback(...args));
  }
});
//# sourceMappingURL=preload.js.map
