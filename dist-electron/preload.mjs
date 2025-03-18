"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  selectFiles: () => electron.ipcRenderer.invoke("select-files"),
  saveMedia: (data) => electron.ipcRenderer.invoke("save-media", data),
  // Database operations
  getMediaTypes: () => electron.ipcRenderer.invoke("get-media-types"),
  getSourceTypes: () => electron.ipcRenderer.invoke("get-source-types"),
  getCollections: () => electron.ipcRenderer.invoke("get-collections"),
  getTags: () => electron.ipcRenderer.invoke("get-tags"),
  getPeople: () => electron.ipcRenderer.invoke("get-people")
  // Other existing APIs...
});
