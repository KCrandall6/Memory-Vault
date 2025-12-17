const { contextBridge: o, ipcRenderer: i } = require("electron");
o.exposeInMainWorld("electronAPI", {
  selectFiles: () => i.invoke("select-files"),
  saveMedia: (e) => i.invoke("save-media", e),
  getFilePreview: (e) => i.invoke("get-file-preview", e),
  getMediaTypes: () => i.invoke("get-media-types"),
  getCollections: () => i.invoke("get-collections"),
  getTags: () => i.invoke("get-tags"),
  getPeople: () => i.invoke("get-people"),
  searchMedia: (e) => i.invoke("search-media", e),
  getMediaDetails: (e) => i.invoke("get-media-details", e),
  updateMediaDetails: (e) => i.invoke("update-media-details", e),
  downloadMediaFile: (e) => i.invoke("download-media-file", e),
  onMainProcessMessage: (e) => {
    i.on("main-process-message", (t, ...a) => e(...a));
  }
});
//# sourceMappingURL=preload.js.map
