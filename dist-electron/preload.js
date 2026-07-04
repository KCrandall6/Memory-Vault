const { contextBridge: n, ipcRenderer: e } = require("electron");
n.exposeInMainWorld("electronAPI", {
  getUpdateState: () => e.invoke("updates:get-state"),
  checkForUpdates: () => e.invoke("updates:check"),
  downloadUpdate: () => e.invoke("updates:download"),
  quitAndInstallUpdate: () => e.invoke("updates:quit-and-install"),
  onUpdateStateChanged: (t) => {
    const a = (o, i) => t(i);
    return e.on("updates:state-changed", a), () => e.removeListener("updates:state-changed", a);
  },
  getLibraryStatus: () => e.invoke("get-library-status"),
  chooseCreateNewLibrary: () => e.invoke("choose-create-new-library"),
  chooseOpenExistingLibrary: () => e.invoke("choose-open-existing-library"),
  getLibraryPaths: () => e.invoke("get-library-paths"),
  selectFiles: () => e.invoke("select-files"),
  saveMedia: (t) => e.invoke("save-media", t),
  getFilePreview: (t) => e.invoke("get-file-preview", t),
  getMediaTypes: () => e.invoke("get-media-types"),
  getCollections: () => e.invoke("get-collections"),
  getTags: () => e.invoke("get-tags"),
  getPeople: () => e.invoke("get-people"),
  searchMedia: (t) => e.invoke("search-media", t),
  getDashboardSummary: () => e.invoke("get-dashboard-summary"),
  getCollectionSummaries: () => e.invoke("get-collection-summaries"),
  getCollectionMedia: (t) => e.invoke("get-collection-media", t),
  getPeopleSummaries: () => e.invoke("get-people-summaries"),
  getPersonMedia: (t) => e.invoke("get-person-media", t),
  getTagSummaries: () => e.invoke("get-tag-summaries"),
  getTagMedia: (t) => e.invoke("get-tag-media", t),
  getDateSummaries: () => e.invoke("get-date-summaries"),
  getDateMedia: (t) => e.invoke("get-date-media", t),
  updateCollectionDetails: (t) => e.invoke("update-collection-details", t),
  deleteCollection: (t) => e.invoke("delete-collection", t),
  deleteMedia: (t) => e.invoke("delete-media", t),
  getMediaDetails: (t) => e.invoke("get-media-details", t),
  updateMediaDetails: (t) => e.invoke("update-media-details", t),
  getMemoryNotes: (t) => e.invoke("get-memory-notes", t),
  addMemoryNote: (t, a) => e.invoke("add-memory-note", t, a),
  downloadMediaFile: (t) => e.invoke("download-media-file", t),
  getVaultSettings: () => e.invoke("get-vault-settings"),
  openVaultFolder: () => e.invoke("open-vault-folder"),
  openArchiveFolder: () => e.invoke("open-archive-folder"),
  getVaultHealth: () => e.invoke("get-vault-health"),
  createVaultBackup: () => e.invoke("create-vault-backup"),
  createVaultShareableCopy: () => e.invoke("create-vault-shareable-copy"),
  openVaultOutputFolder: (t) => e.invoke("open-vault-output-folder", t),
  onMainProcessMessage: (t) => {
    e.on("main-process-message", (a, ...o) => t(...o));
  }
});
//# sourceMappingURL=preload.js.map
