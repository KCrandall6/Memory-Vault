import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
const require2 = createRequire(import.meta.url);
const Database = require2("better-sqlite3");
const fs = require2("fs");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let dbInstance = null;
function initializeDatabase() {
  console.log("Initializing database...");
  const dbPath = path.resolve(process.cwd(), "..", "Database", "memory-vault.db");
  console.log(`Database path: ${dbPath}`);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }
  try {
    const db = new Database(dbPath);
    console.log("Database connection established");
    db.pragma("foreign_keys = ON");
    const sqlPath = path.resolve(process.cwd(), "resources", "create-database.sql");
    console.log(`SQL file path: ${sqlPath}`);
    if (!fs.existsSync(sqlPath)) {
      console.error("SQL file does not exist at path:", sqlPath);
      return null;
    }
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log("SQL file read successfully");
    db.exec(sql);
    console.log("SQL commands executed");
    insertDefaultData(db);
    console.log("Database initialized successfully");
    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    return null;
  }
}
function insertDefaultData(db) {
  if (!db) return;
  try {
    const mediaTypeCount = db.prepare("SELECT COUNT(*) as count FROM MediaTypes").get().count;
    if (mediaTypeCount === 0) {
      const mediaTypes = ["Image", "Video", "Document", "Audio"];
      const insertMediaType = db.prepare("INSERT INTO MediaTypes (name) VALUES (?)");
      mediaTypes.forEach((type) => {
        insertMediaType.run(type);
      });
    }
    const sourceTypeCount = db.prepare("SELECT COUNT(*) as count FROM SourceTypes").get().count;
    if (sourceTypeCount === 0) {
      const sourceTypes = ["Digital Camera", "Phone", "Scanned Photo", "Scanned Document", "Slide", "Negative"];
      const insertSourceType = db.prepare("INSERT INTO SourceTypes (name) VALUES (?)");
      sourceTypes.forEach((type) => {
        insertSourceType.run(type);
      });
    }
    console.log("Default data inserted successfully");
  } catch (error) {
    console.error("Error inserting default data:", error);
  }
}
function getAllMedia(db) {
  if (!db) {
    console.error("Database not initialized");
    return [];
  }
  try {
    return db.prepare(`
      SELECT m.*, mt.name as media_type, st.name as source_type, c.name as collection_name
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      ORDER BY m.created_at DESC
    `).all();
  } catch (error) {
    console.error("Error getting all media:", error);
    return [];
  }
}
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.openDevTools();
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function setupIpcHandlers() {
  try {
    console.log("Setting up IPC handlers...");
    ipcMain.handle("get-all-media", () => {
      console.log("IPC: Getting all media");
      return getAllMedia(dbInstance);
    });
  } catch (error) {
    console.error("Error setting up IPC handlers:", error);
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (dbInstance) {
      dbInstance.close();
    }
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
    console.log("App is ready, initializing database...");
    dbInstance = initializeDatabase();
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
