import require$$0, { app as app$1, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "url";
import path$1 from "path";
import fs$1 from "fs/promises";
import require$$2 from "fs";
import require$$3 from "better-sqlite3";
const currentFilePath$1 = import.meta.url;
const currentDir$1 = path$1.dirname(fileURLToPath(currentFilePath$1));
async function testDatabase() {
  try {
    console.log("Process cwd:", process.cwd());
    console.log("Current directory:", currentDir$1);
    const SQLite3Module = await import("better-sqlite3");
    const SQLite3 = SQLite3Module.default;
    const dbPath = path$1.resolve(currentDir$1, "..", "..", "..", "Database", "memory-vault.db");
    console.log(`Testing database at: ${dbPath}`);
    try {
      const stats = await fs$1.stat(dbPath);
      console.log("Database file exists, size:", stats.size);
    } catch (err) {
      console.log("Database file does not exist, will create it");
      try {
        await fs$1.mkdir(path$1.dirname(dbPath), { recursive: true });
        console.log("Created database directory");
      } catch (err2) {
        if (err2.code !== "EEXIST") {
          console.error("Failed to create database directory:", err2);
          throw err2;
        }
      }
    }
    const db2 = new SQLite3(dbPath);
    console.log("Database connection established successfully");
    db2.pragma("foreign_keys = ON");
    try {
      const result = db2.prepare("SELECT COUNT(*) as count FROM sqlite_master").get();
      console.log("Database query successful:", result);
      if (result.count === 0) {
        console.log("Database is empty, creating tables...");
        try {
          const sqlPath = path$1.resolve(currentDir$1, "..", "..", "resources", "create-database.sql");
          console.log("Looking for SQL file at:", sqlPath);
          const sql = await fs$1.readFile(sqlPath, "utf8");
          console.log("SQL file loaded, length:", sql.length);
          db2.exec(sql);
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
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
const { app } = require$$0;
const path = path$1;
const fs = require$$2;
const Database = require$$3;
let db;
try {
  const appDataPath = app.getPath("userData");
  const dbDir = path.join(appDataPath, "MemoryVault", "Database");
  const dbPath = path.join(dbDir, "memory-vault.db");
  console.log(`Database path: ${dbPath}`);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  const sqlPath = path.join(process.cwd(), "resources", "create-database.sql");
  if (fs.existsSync(sqlPath)) {
    const sqlScript = fs.readFileSync(sqlPath, "utf8");
    db.exec(sqlScript);
    console.log("Database schema initialized");
  }
  initializeDefaultValues();
  console.log("Database connection established successfully");
} catch (error) {
  console.error("Error connecting to database:", error);
  db = null;
}
function initializeDefaultValues() {
  try {
    if (!db) return;
    const mediaTypesCount = db.prepare("SELECT COUNT(*) as count FROM MediaTypes").get().count;
    if (mediaTypesCount === 0) {
      const mediaTypes = [
        "Image",
        "Video",
        "Document",
        "Audio"
      ];
      const insertStmt = db.prepare("INSERT INTO MediaTypes (name) VALUES (?)");
      mediaTypes.forEach((name) => insertStmt.run(name));
      console.log("Initialized default media types");
    }
    const sourceTypesCount = db.prepare("SELECT COUNT(*) as count FROM SourceTypes").get().count;
    if (sourceTypesCount === 0) {
      const sourceTypes = [
        "Digital Camera",
        "Phone",
        "Scanned Photo",
        "Scanned Document",
        "Internet",
        "Other"
      ];
      const insertStmt = db.prepare("INSERT INTO SourceTypes (name) VALUES (?)");
      sourceTypes.forEach((name) => insertStmt.run(name));
      console.log("Initialized default source types");
    }
    const collectionsCount = db.prepare("SELECT COUNT(*) as count FROM Collections").get().count;
    if (collectionsCount === 0) {
      db.prepare("INSERT INTO Collections (name, description) VALUES (?, ?)").run("General", "Default collection for uncategorized media");
      console.log("Created default collection");
    }
  } catch (error) {
    console.error("Error initializing default values:", error);
  }
}
function getAllMedia() {
  try {
    if (!db) return [];
    const stmt = db.prepare(`
      SELECT m.*, mt.name as media_type, st.name as source_type, c.name as collection_name
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      ORDER BY m.created_at DESC
    `);
    return stmt.all();
  } catch (error) {
    console.error("Error getting all media:", error);
    return [];
  }
}
function addMedia(mediaData) {
  try {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare(`
      INSERT INTO Media (
        file_name, file_path, thumbnail_path, title, description,
        media_type_id, source_type_id, capture_date, location, collection_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      mediaData.file_name,
      mediaData.file_path,
      mediaData.thumbnail_path,
      mediaData.title,
      mediaData.description,
      mediaData.media_type_id,
      mediaData.source_type_id,
      mediaData.capture_date,
      mediaData.location,
      mediaData.collection_id
    );
    return info.lastInsertRowid;
  } catch (error) {
    console.error("Error adding media:", error);
    throw error;
  }
}
function getMediaTypes() {
  try {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM MediaTypes ORDER BY name");
    return stmt.all();
  } catch (error) {
    console.error("Error getting media types:", error);
    return [];
  }
}
function getSourceTypes() {
  try {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM SourceTypes ORDER BY name");
    return stmt.all();
  } catch (error) {
    console.error("Error getting source types:", error);
    return [];
  }
}
function getCollections() {
  try {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM Collections ORDER BY name");
    return stmt.all();
  } catch (error) {
    console.error("Error getting collections:", error);
    return [];
  }
}
function getTags() {
  try {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM Tags ORDER BY name");
    return stmt.all();
  } catch (error) {
    console.error("Error getting tags:", error);
    return [];
  }
}
function getPeople() {
  try {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM People ORDER BY name");
    return stmt.all();
  } catch (error) {
    console.error("Error getting people:", error);
    return [];
  }
}
function addTag(name) {
  try {
    if (!db) throw new Error("Database not initialized");
    const existingTag = db.prepare("SELECT id FROM Tags WHERE name = ?").get(name);
    if (existingTag) {
      return existingTag.id;
    }
    const stmt = db.prepare("INSERT INTO Tags (name) VALUES (?)");
    const info = stmt.run(name);
    return info.lastInsertRowid;
  } catch (error) {
    console.error("Error adding tag:", error);
    throw error;
  }
}
function addPerson(name) {
  try {
    if (!db) throw new Error("Database not initialized");
    const existingPerson = db.prepare("SELECT id FROM People WHERE name = ?").get(name);
    if (existingPerson) {
      return existingPerson.id;
    }
    const stmt = db.prepare("INSERT INTO People (name) VALUES (?)");
    const info = stmt.run(name);
    return info.lastInsertRowid;
  } catch (error) {
    console.error("Error adding person:", error);
    throw error;
  }
}
function linkTagToMedia(mediaId, tagId) {
  try {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare("INSERT OR IGNORE INTO MediaTags (media_id, tag_id) VALUES (?, ?)");
    stmt.run(mediaId, tagId);
    return true;
  } catch (error) {
    console.error("Error linking tag to media:", error);
    throw error;
  }
}
function linkPersonToMedia(mediaId, personId) {
  try {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare("INSERT OR IGNORE INTO MediaPeople (media_id, person_id) VALUES (?, ?)");
    stmt.run(mediaId, personId);
    return true;
  } catch (error) {
    console.error("Error linking person to media:", error);
    throw error;
  }
}
var database = {
  getAllMedia,
  addMedia,
  getMediaTypes,
  getSourceTypes,
  getCollections,
  getTags,
  getPeople,
  addTag,
  addPerson,
  linkTagToMedia,
  linkPersonToMedia
};
const dbOperations = /* @__PURE__ */ getDefaultExportFromCjs(database);
const getAppDataPath = () => {
  const appDataPath = path$1.join(app$1.getPath("userData"), "MemoryVault");
  return appDataPath;
};
async function ensureDirectoriesExist() {
  const mediaDir = path$1.join(getAppDataPath(), "Media");
  try {
    await fs$1.mkdir(mediaDir, { recursive: true });
    return { mediaDir };
  } catch (error) {
    console.error("Error creating directories:", error);
    throw error;
  }
}
function generateUniqueFilename(originalFilename) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = path$1.extname(originalFilename);
  const name = path$1.basename(originalFilename, ext);
  return `${name}_${timestamp}_${randomString}${ext}`;
}
async function saveMediaFile(sourcePath, filename) {
  try {
    const { mediaDir } = await ensureDirectoriesExist();
    const uniqueFilename = generateUniqueFilename(filename);
    const destinationPath = path$1.join(mediaDir, uniqueFilename);
    await fs$1.copyFile(sourcePath, destinationPath);
    return {
      filePath: destinationPath,
      fileName: uniqueFilename,
      relativePath: path$1.join("Media", uniqueFilename)
    };
  } catch (error) {
    console.error("Error saving media file:", error);
    throw error;
  }
}
async function processMediaFile(filePath, fileName) {
  try {
    const fileInfo = await saveMediaFile(filePath, fileName);
    return {
      ...fileInfo,
      thumbnail: null
      // No thumbnail
    };
  } catch (error) {
    console.error("Error processing media file:", error);
    throw error;
  }
}
const currentFilePath = import.meta.url;
const currentDir = path$1.dirname(fileURLToPath(currentFilePath));
process.env.APP_ROOT = path$1.join(currentDir, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
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
      const stats = await fs$1.stat(filePath);
      return {
        path: filePath,
        name: path$1.basename(filePath),
        size: stats.size,
        type: path$1.extname(filePath).toLowerCase(),
        lastModified: stats.mtime.getTime()
      };
    }));
  });
  ipcMain.handle("get-file-preview", async (_, filePath) => {
    try {
      console.log("Generating preview for:", filePath);
      const data = await fs$1.readFile(filePath);
      const ext = path$1.extname(filePath).toLowerCase().substring(1);
      const base64 = data.toString("base64");
      let mimeType = "application/octet-stream";
      if (["jpg", "jpeg"].includes(ext)) mimeType = "image/jpeg";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "gif") mimeType = "image/gif";
      else if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "mp4") mimeType = "video/mp4";
      console.log("Preview generated with mime type:", mimeType);
      return {
        dataUrl: `data:${mimeType};base64,${base64}`,
        mimeType
      };
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  });
  ipcMain.handle("get-media-types", async () => {
    try {
      const types = await dbOperations.getMediaTypes();
      console.log("Media types from database:", types);
      return types.length > 0 ? types : [
        { id: 1, name: "Image" },
        { id: 2, name: "Video" },
        { id: 3, name: "Document" },
        { id: 4, name: "Audio" }
      ];
    } catch (error) {
      console.error("Error getting media types:", error);
      return [
        { id: 1, name: "Image" },
        { id: 2, name: "Video" },
        { id: 3, name: "Document" },
        { id: 4, name: "Audio" }
      ];
    }
  });
  ipcMain.handle("get-source-types", async () => {
    try {
      const types = await dbOperations.getSourceTypes();
      console.log("Source types from database:", types);
      return types.length > 0 ? types : [
        { id: 1, name: "Digital Camera" },
        { id: 2, name: "Phone" },
        { id: 3, name: "Scanned Photo" },
        { id: 4, name: "Scanned Document" },
        { id: 5, name: "Internet" },
        { id: 6, name: "Other" }
      ];
    } catch (error) {
      console.error("Error getting source types:", error);
      return [
        { id: 1, name: "Digital Camera" },
        { id: 2, name: "Phone" },
        { id: 3, name: "Scanned Photo" },
        { id: 4, name: "Scanned Document" },
        { id: 5, name: "Internet" },
        { id: 6, name: "Other" }
      ];
    }
  });
  ipcMain.handle("get-collections", async () => {
    try {
      return await dbOperations.getCollections();
    } catch (error) {
      console.error("Error getting collections:", error);
      return [
        { id: 1, name: "Family Vacation 2023" },
        { id: 2, name: "Wedding Anniversary" },
        { id: 3, name: "Birthday Party" }
      ];
    }
  });
  ipcMain.handle("get-tags", async () => {
    try {
      return await dbOperations.getTags();
    } catch (error) {
      console.error("Error getting tags:", error);
      return [
        { id: 1, name: "family" },
        { id: 2, name: "vacation" },
        { id: 3, name: "birthday" }
      ];
    }
  });
  ipcMain.handle("get-people", async () => {
    try {
      return await dbOperations.getPeople();
    } catch (error) {
      console.error("Error getting people:", error);
      return [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Jane Smith" },
        { id: 3, name: "Alex Johnson" }
      ];
    }
  });
  ipcMain.handle("save-media", async (_, data) => {
    try {
      console.log("Saving media:", data);
      const processedFile = await processMediaFile(data.filePath, path$1.basename(data.filePath));
      const mediaData = {
        file_name: processedFile.fileName,
        file_path: processedFile.relativePath,
        thumbnail_path: null,
        title: data.metadata.title,
        description: data.metadata.description,
        media_type_id: parseInt(data.metadata.mediaTypeId),
        source_type_id: data.metadata.sourceTypeId ? parseInt(data.metadata.sourceTypeId) : null,
        capture_date: data.metadata.captureDate || null,
        location: data.metadata.location || null,
        collection_id: data.metadata.collectionId ? parseInt(data.metadata.collectionId) : null
      };
      const mediaId = await dbOperations.addMedia(mediaData);
      console.log(`Media saved with ID: ${mediaId}`);
      if (data.metadata.tags && data.metadata.tags.length > 0) {
        for (const tag of data.metadata.tags) {
          const tagId = tag.id < 0 ? await dbOperations.addTag(tag.name) : tag.id;
          await dbOperations.linkTagToMedia(mediaId, tagId);
        }
      }
      if (data.metadata.people && data.metadata.people.length > 0) {
        for (const person of data.metadata.people) {
          const personId = person.id < 0 ? await dbOperations.addPerson(person.name) : person.id;
          await dbOperations.linkPersonToMedia(mediaId, personId);
        }
      }
      return { success: true, mediaId };
    } catch (error) {
      console.error("Error saving media:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  });
}
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$1.join(currentDir, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    width: 1200,
    height: 800
  });
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
app$1.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app$1.quit();
    win = null;
  }
});
app$1.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app$1.whenReady().then(async () => {
  try {
    const dbTestResult = await testDatabase();
    console.log("Database test result:", dbTestResult);
    await ensureDirectoriesExist();
    setupIpcHandlers();
    createWindow();
    console.log("App initialized successfully");
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
//# sourceMappingURL=main.js.map
