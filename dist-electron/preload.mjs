"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  selectFiles: () => electron.ipcRenderer.invoke("select-files"),
  saveMedia: (data) => electron.ipcRenderer.invoke("save-media", data),
  getThumbnail: (filePath) => electron.ipcRenderer.invoke("get-thumbnail", filePath),
  // Database operations
  getMediaTypes: () => electron.ipcRenderer.invoke("get-media-types"),
  getSourceTypes: () => electron.ipcRenderer.invoke("get-source-types"),
  getCollections: () => electron.ipcRenderer.invoke("get-collections"),
  getTags: () => electron.ipcRenderer.invoke("get-tags"),
  getPeople: () => electron.ipcRenderer.invoke("get-people"),
  // Event listeners
  onMainProcessMessage: (callback) => {
    electron.ipcRenderer.on("main-process-message", (_event, ...args) => callback(...args));
  }
});
