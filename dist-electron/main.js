import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
const currentFilePath$1 = import.meta.url;
const currentDir$1 = path.dirname(fileURLToPath(currentFilePath$1));
async function testDatabase() {
  try {
    console.log("Process cwd:", process.cwd());
    console.log("Current directory:", currentDir$1);
    const SQLite3Module = await import("./index-OAQBM0eU.js").then((n) => n.i);
    const SQLite3 = SQLite3Module.default;
    const dbPath = path.resolve(currentDir$1, "..", "..", "..", "Database", "memory-vault.db");
    console.log(`Testing database at: ${dbPath}`);
    try {
      const stats = await fs.stat(dbPath);
      console.log("Database file exists, size:", stats.size);
    } catch (err) {
      console.log("Database file does not exist, will create it");
      try {
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        console.log("Created database directory");
      } catch (err2) {
        if (err2.code !== "EEXIST") {
          console.error("Failed to create database directory:", err2);
          throw err2;
        }
      }
    }
    const db = new SQLite3(dbPath);
    console.log("Database connection established successfully");
    db.pragma("foreign_keys = ON");
    try {
      const result = db.prepare("SELECT COUNT(*) as count FROM sqlite_master").get();
      console.log("Database query successful:", result);
      if (result.count === 0) {
        console.log("Database is empty, creating tables...");
        try {
          const sqlPath = path.resolve(currentDir$1, "..", "..", "resources", "create-database.sql");
          console.log("Looking for SQL file at:", sqlPath);
          const sql = await fs.readFile(sqlPath, "utf8");
          console.log("SQL file loaded, length:", sql.length);
          db.exec(sql);
          console.log("Database tables created successfully");
        } catch (err) {
          console.error("Failed to create database tables:", err);
        }
      }
    } catch (err) {
      console.error("Query failed:", err);
    }
    return true;
  } catch (error) {
    console.error("Database test failed:", error);
    return false;
  }
}
const currentFilePath = import.meta.url;
const currentDir = path.dirname(fileURLToPath(currentFilePath));
process.env.APP_ROOT = path.join(currentDir, "..");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function setupIpcHandlers() {
  ipcMain.handle("select-files", async () => {
    console.log("Showing file dialog...");
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Media Files", extensions: ["jpg", "jpeg", "png", "gif", "mp4", "pdf", "doc", "docx"] }
      ]
    });
    if (canceled) {
      return [];
    }
    return Promise.all(filePaths.map(async (filePath) => {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        type: path.extname(filePath).toLowerCase(),
        lastModified: stats.mtime.getTime()
      };
    }));
  });
  ipcMain.handle("get-media-types", () => {
    return [
      { id: 1, name: "Image" },
      { id: 2, name: "Video" },
      { id: 3, name: "Document" },
      { id: 4, name: "Audio" }
    ];
  });
  ipcMain.handle("get-source-types", () => {
    return [
      { id: 1, name: "Digital Camera" },
      { id: 2, name: "Phone" },
      { id: 3, name: "Scanned Photo" },
      { id: 4, name: "Scanned Document" }
    ];
  });
  ipcMain.handle("get-collections", () => {
    return [
      { id: 1, name: "Family Vacation 2023" },
      { id: 2, name: "Wedding Anniversary" },
      { id: 3, name: "Birthday Party" }
    ];
  });
  ipcMain.handle("save-media", async (_, data) => {
    console.log("Mock saving media:", data);
    return { success: true, mediaId: 1 };
  });
}
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(currentDir, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  try {
    setupIpcHandlers();
    createWindow();
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});
app.whenReady().then(async () => {
  try {
    const dbTestResult = await testDatabase();
    console.log("Database test result:", dbTestResult);
    setupIpcHandlers();
    createWindow();
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
