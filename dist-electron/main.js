import require$$0, { app as app$2, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "url";
import path$2 from "path";
import fs$2 from "fs/promises";
import require$$2 from "fs";
import require$$3 from "better-sqlite3";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
const { app: app$1 } = require$$0;
const path$1 = path$2;
const fs$1 = require$$2;
const ARCHIVE_FOLDER_NAME$1 = "Memory Vault Archive";
const DATABASE_FILENAME = "memoryvault.db";
function resolveStorageRoot() {
  if (app$1.isPackaged) {
    return path$1.dirname(process.execPath);
  }
  return path$1.join(app$1.getPath("userData"), "MemoryVault");
}
function ensureStorageRoot$2() {
  const root = resolveStorageRoot();
  if (!fs$1.existsSync(root)) {
    fs$1.mkdirSync(root, { recursive: true });
  }
  return root;
}
function ensureArchiveDirectory$3() {
  const root = ensureStorageRoot$2();
  const archiveDir = path$1.join(root, ARCHIVE_FOLDER_NAME$1);
  if (!fs$1.existsSync(archiveDir)) {
    fs$1.mkdirSync(archiveDir, { recursive: true });
  }
  return archiveDir;
}
function getDatabasePath$2() {
  const root = ensureStorageRoot$2();
  return path$1.join(root, DATABASE_FILENAME);
}
var storageRoot$1 = {
  ARCHIVE_FOLDER_NAME: ARCHIVE_FOLDER_NAME$1,
  DATABASE_FILENAME,
  resolveStorageRoot,
  ensureStorageRoot: ensureStorageRoot$2,
  ensureArchiveDirectory: ensureArchiveDirectory$3,
  getDatabasePath: getDatabasePath$2
};
const storageRoot$2 = /* @__PURE__ */ getDefaultExportFromCjs(storageRoot$1);
const {
  ensureArchiveDirectory: ensureArchiveDirectory$2,
  getDatabasePath: getDatabasePath$1
} = storageRoot$2;
const currentFilePath$1 = import.meta.url;
const currentDir$1 = path$2.dirname(fileURLToPath(currentFilePath$1));
async function testDatabase() {
  try {
    console.log("Process cwd:", process.cwd());
    console.log("Current directory:", currentDir$1);
    const SQLite3Module = await import("better-sqlite3");
    const SQLite3 = SQLite3Module.default;
    ensureArchiveDirectory$2();
    const dbPath = getDatabasePath$1();
    console.log(`Testing database at: ${dbPath}`);
    try {
      const stats = await fs$2.stat(dbPath);
      console.log("Database file exists, size:", stats.size);
    } catch (err) {
      console.log("Database file does not exist, will create it");
      try {
        await fs$2.mkdir(path$2.dirname(dbPath), { recursive: true });
        console.log("Created database directory");
      } catch (err2) {
        if (err2 instanceof Error && "code" in err2 && err2.code !== "EEXIST") {
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
          const resourcesPath = process.resourcesPath ?? "";
          const candidatePaths = [
            path$2.resolve(currentDir$1, "..", "resources", "create-database.sql"),
            path$2.resolve(process.cwd(), "resources", "create-database.sql"),
            resourcesPath ? path$2.join(resourcesPath, "create-database.sql") : ""
          ];
          const existingPath = await findExistingPath(candidatePaths);
          if (!existingPath) {
            console.warn("Could not locate create-database.sql");
            return false;
          }
          console.log("Loading SQL file from:", existingPath);
          const sql = await fs$2.readFile(existingPath, "utf8");
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
async function findExistingPath(paths) {
  for (const candidate of paths) {
    if (!candidate) {
      continue;
    }
    try {
      const stats = await fs$2.stat(candidate);
      if (stats.isFile()) {
        return candidate;
      }
    } catch (err) {
    }
  }
  return null;
}
const { app } = require$$0;
const path = path$2;
const fs = require$$2;
const Database = require$$3;
const storageRoot = storageRoot$1;
const {
  ensureStorageRoot: ensureStorageRoot$1,
  ensureArchiveDirectory: ensureArchiveDirectory$1,
  getDatabasePath
} = storageRoot;
function resolveSchemaPath() {
  const candidatePaths = [
    path.join(process.cwd(), "resources", "create-database.sql"),
    path.join(app.getAppPath(), "resources", "create-database.sql"),
    path.join(process.resourcesPath || "", "create-database.sql")
  ];
  for (const candidate of candidatePaths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}
let db;
try {
  ensureStorageRoot$1();
  ensureArchiveDirectory$1();
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  console.log(`Database path: ${dbPath}`);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  const sqlPath = resolveSchemaPath();
  if (sqlPath) {
    const sqlScript = fs.readFileSync(sqlPath, "utf8");
    db.exec(sqlScript);
    console.log("Database schema initialized");
  } else {
    console.warn("Database schema file not found. Skipping initialization script.");
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
function buildRelevanceClause({ searchTerm, titleTerm, locationTerm, peopleText, tagsText }) {
  const clauses = [];
  const params = [];
  if (searchTerm) {
    const like = `%${searchTerm}%`;
    clauses.push(`CASE WHEN LOWER(m.title) LIKE ? THEN 5 ELSE 0 END`);
    params.push(like);
    clauses.push(`CASE WHEN LOWER(m.description) LIKE ? THEN 3 ELSE 0 END`);
    params.push(like);
    clauses.push(`CASE WHEN LOWER(m.location) LIKE ? THEN 2 ELSE 0 END`);
    params.push(like);
  }
  if (titleTerm) {
    clauses.push(`CASE WHEN LOWER(m.title) LIKE ? THEN 4 ELSE 0 END`);
    params.push(`%${titleTerm}%`);
  }
  if (locationTerm) {
    clauses.push(`CASE WHEN LOWER(m.location) LIKE ? THEN 2 ELSE 0 END`);
    params.push(`%${locationTerm}%`);
  }
  if (peopleText) {
    clauses.push(`CASE WHEN EXISTS (SELECT 1 FROM MediaPeople mp JOIN People p ON p.id = mp.person_id WHERE mp.media_id = m.id AND LOWER(p.name) LIKE ?) THEN 3 ELSE 0 END`);
    params.push(`%${peopleText}%`);
  }
  if (tagsText) {
    clauses.push(`CASE WHEN EXISTS (SELECT 1 FROM MediaTags mt2 JOIN Tags t2 ON t2.id = mt2.tag_id WHERE mt2.media_id = m.id AND LOWER(t2.name) LIKE ?) THEN 2 ELSE 0 END`);
    params.push(`%${tagsText}%`);
  }
  const relevanceSql = clauses.length > 0 ? clauses.join(" + ") : "0";
  return { relevanceSql, relevanceParams: params };
}
function mapAggregates(row) {
  return {
    ...row,
    media_type: row.media_type,
    collection_name: row.collection_name,
    tags: row.tags ? row.tags.split("|").filter(Boolean) : [],
    people: row.people ? row.people.split("|").filter(Boolean) : []
  };
}
function searchMedia(criteria = {}) {
  try {
    if (!db) return [];
    const {
      text,
      title,
      location,
      mediaTypeIds = [],
      collectionIds = [],
      tagIds = [],
      personIds = [],
      dateFrom,
      dateTo,
      peopleText,
      tagsText,
      sort = "newest",
      limit = 25,
      offset = 0
    } = criteria;
    const searchTerm = text ? text.toLowerCase().trim() : "";
    const titleTerm = title ? title.toLowerCase().trim() : "";
    const locationTerm = location ? location.toLowerCase().trim() : "";
    const peopleTerm = peopleText ? peopleText.toLowerCase().trim() : "";
    const tagsTerm = tagsText ? tagsText.toLowerCase().trim() : "";
    const { relevanceSql, relevanceParams } = buildRelevanceClause({
      searchTerm,
      titleTerm,
      locationTerm,
      peopleText: peopleTerm,
      tagsText: tagsTerm
    });
    let query = `
      SELECT
        m.id,
        m.title,
        m.description,
        m.capture_date,
        m.created_at,
        m.location,
        m.file_path,
        m.thumbnail_path,
        m.media_type_id,
        mt.name as media_type,
        c.name as collection_name,
        REPLACE(GROUP_CONCAT(DISTINCT t.name), ',', '|') as tags,
        REPLACE(GROUP_CONCAT(DISTINCT p.name), ',', '|') as people,
        ${relevanceSql} as relevance
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      LEFT JOIN MediaTags mtg ON m.id = mtg.media_id
      LEFT JOIN Tags t ON mtg.tag_id = t.id
      LEFT JOIN MediaPeople mp ON m.id = mp.media_id
      LEFT JOIN People p ON mp.person_id = p.id
      WHERE 1=1
    `;
    const params = [...relevanceParams];
    if (searchTerm) {
      const like = `%${searchTerm}%`;
      query += ` AND (LOWER(m.title) LIKE ? OR LOWER(m.description) LIKE ? OR LOWER(m.location) LIKE ?)`;
      params.push(like, like, like);
    }
    if (titleTerm) {
      query += ` AND LOWER(m.title) LIKE ?`;
      params.push(`%${titleTerm}%`);
    }
    if (locationTerm) {
      query += ` AND LOWER(m.location) LIKE ?`;
      params.push(`%${locationTerm}%`);
    }
    if (mediaTypeIds.length > 0) {
      const placeholders = mediaTypeIds.map(() => "?").join(",");
      query += ` AND m.media_type_id IN (${placeholders})`;
      params.push(...mediaTypeIds);
    }
    if (collectionIds.length > 0) {
      const placeholders = collectionIds.map(() => "?").join(",");
      query += ` AND m.collection_id IN (${placeholders})`;
      params.push(...collectionIds);
    }
    if (dateFrom) {
      query += ` AND m.capture_date >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND m.capture_date <= ?`;
      params.push(dateTo);
    }
    if (tagIds.length > 0) {
      const placeholders = tagIds.map(() => "?").join(",");
      query += `
        AND m.id IN (
          SELECT media_id
          FROM MediaTags
          WHERE tag_id IN (${placeholders})
          GROUP BY media_id
          HAVING COUNT(DISTINCT tag_id) = ?
        )
      `;
      params.push(...tagIds, tagIds.length);
    }
    if (personIds.length > 0) {
      const placeholders = personIds.map(() => "?").join(",");
      query += `
        AND m.id IN (
          SELECT media_id
          FROM MediaPeople
          WHERE person_id IN (${placeholders})
          GROUP BY media_id
          HAVING COUNT(DISTINCT person_id) = ?
        )
      `;
      params.push(...personIds, personIds.length);
    }
    if (peopleTerm) {
      query += ` AND EXISTS (SELECT 1 FROM MediaPeople mp2 JOIN People p2 ON p2.id = mp2.person_id WHERE mp2.media_id = m.id AND LOWER(p2.name) LIKE ?)`;
      params.push(`%${peopleTerm}%`);
    }
    if (tagsTerm) {
      query += ` AND EXISTS (SELECT 1 FROM MediaTags mt2 JOIN Tags t2 ON t2.id = mt2.tag_id WHERE mt2.media_id = m.id AND LOWER(t2.name) LIKE ?)`;
      params.push(`%${tagsTerm}%`);
    }
    query += " GROUP BY m.id";
    const sortClause = (() => {
      switch (sort) {
        case "oldest":
          return "CASE WHEN m.capture_date IS NULL THEN 1 ELSE 0 END, m.capture_date ASC, m.created_at ASC";
        case "title":
          return "LOWER(m.title) ASC";
        case "type":
          return "LOWER(mt.name) ASC, m.created_at DESC";
        default:
          return "relevance DESC, CASE WHEN m.capture_date IS NULL THEN 1 ELSE 0 END, m.capture_date DESC, m.created_at DESC";
      }
    })();
    query += ` ORDER BY ${sortClause}`;
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(mapAggregates);
  } catch (error) {
    console.error("Error searching media:", error);
    return [];
  }
}
function getMediaDetails(id) {
  try {
    if (!db) return null;
    const stmt = db.prepare(`
      SELECT
        m.id,
        m.title,
        m.description,
        m.capture_date,
        m.created_at,
        m.location,
        m.file_path,
        m.thumbnail_path,
        m.media_type_id,
        mt.name as media_type,
        c.name as collection_name,
        REPLACE(GROUP_CONCAT(DISTINCT t.name), ',', '|') as tags,
        REPLACE(GROUP_CONCAT(DISTINCT p.name), ',', '|') as people
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      LEFT JOIN MediaTags mtg ON m.id = mtg.media_id
      LEFT JOIN Tags t ON mtg.tag_id = t.id
      LEFT JOIN MediaPeople mp ON m.id = mp.media_id
      LEFT JOIN People p ON mp.person_id = p.id
      WHERE m.id = ?
      GROUP BY m.id
    `);
    const row = stmt.get(id);
    if (!row) return null;
    return mapAggregates(row);
  } catch (error) {
    console.error("Error getting media details:", error);
    return null;
  }
}
function resolveCollectionId(collection) {
  if (collection === null || collection === void 0 || collection === "") return null;
  if (typeof collection === "number") return collection;
  const existing = db.prepare("SELECT id FROM Collections WHERE LOWER(name) = LOWER(?)").get(collection);
  if (existing) return existing.id;
  return addCollection(collection, "");
}
function replaceMediaTags(mediaId, tags = []) {
  db.prepare("DELETE FROM MediaTags WHERE media_id = ?").run(mediaId);
  if (!tags || tags.length === 0) return;
  const linkStmt = db.prepare("INSERT OR IGNORE INTO MediaTags (media_id, tag_id) VALUES (?, ?)");
  tags.forEach((tagName) => {
    const tagId = addTag(tagName);
    linkStmt.run(mediaId, tagId);
  });
}
function replaceMediaPeople(mediaId, people = []) {
  db.prepare("DELETE FROM MediaPeople WHERE media_id = ?").run(mediaId);
  if (!people || people.length === 0) return;
  const linkStmt = db.prepare("INSERT OR IGNORE INTO MediaPeople (media_id, person_id) VALUES (?, ?)");
  people.forEach((personName) => {
    const personId = addPerson(personName);
    linkStmt.run(mediaId, personId);
  });
}
function updateMediaWithRelations(id, mediaData) {
  try {
    if (!db) throw new Error("Database not initialized");
    db.prepare("BEGIN").run();
    const collectionId = resolveCollectionId(mediaData.collection);
    const stmt = db.prepare(`
      UPDATE Media SET
        title = ?,
        description = ?,
        capture_date = ?,
        location = ?,
        collection_id = ?,
        media_type_id = COALESCE(?, media_type_id)
      WHERE id = ?
    `);
    stmt.run(
      mediaData.title,
      mediaData.description,
      mediaData.capture_date || null,
      mediaData.location || null,
      collectionId,
      mediaData.media_type_id || null,
      id
    );
    replaceMediaTags(id, mediaData.tags || []);
    replaceMediaPeople(id, mediaData.people || []);
    db.prepare("COMMIT").run();
    return getMediaDetails(id);
  } catch (error) {
    db == null ? void 0 : db.prepare("ROLLBACK").run();
    console.error("Error updating media with relations:", error);
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
function addCollection(name, description = "") {
  try {
    if (!db) throw new Error("Database not initialized");
    const existingCollection = db.prepare("SELECT id FROM Collections WHERE name = ?").get(name);
    if (existingCollection) {
      return existingCollection.id;
    }
    const stmt = db.prepare("INSERT INTO Collections (name, description) VALUES (?, ?)");
    const info = stmt.run(name, description);
    return info.lastInsertRowid;
  } catch (error) {
    console.error("Error adding collection:", error);
    throw error;
  }
}
var database = {
  getAllMedia,
  addMedia,
  searchMedia,
  getMediaDetails,
  getMediaTypes,
  getSourceTypes,
  getCollections,
  getTags,
  getPeople,
  addTag,
  addPerson,
  linkTagToMedia,
  linkPersonToMedia,
  addCollection,
  updateMediaWithRelations
};
const dbOperations = /* @__PURE__ */ getDefaultExportFromCjs(database);
const {
  ensureStorageRoot,
  ensureArchiveDirectory,
  ARCHIVE_FOLDER_NAME
} = storageRoot$2;
async function ensureDirectoriesExist() {
  try {
    const mediaDir = ensureArchiveDirectory();
    return { mediaDir };
  } catch (error) {
    console.error("Error creating directories:", error);
    throw error;
  }
}
function generateUniqueFilename(originalFilename) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = path$2.extname(originalFilename);
  const name = path$2.basename(originalFilename, ext);
  return `${name}_${timestamp}_${randomString}${ext}`;
}
async function saveMediaFile(sourcePath, filename) {
  try {
    const { mediaDir } = await ensureDirectoriesExist();
    const uniqueFilename = generateUniqueFilename(filename);
    const destinationPath = path$2.join(mediaDir, uniqueFilename);
    await fs$2.copyFile(sourcePath, destinationPath);
    return {
      filePath: destinationPath,
      fileName: uniqueFilename,
      relativePath: path$2.join(ARCHIVE_FOLDER_NAME, uniqueFilename)
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
const currentDir = path$2.dirname(fileURLToPath(currentFilePath));
process.env.APP_ROOT = path$2.join(currentDir, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$2.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$2.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$2.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
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
      const stats = await fs$2.stat(filePath);
      return {
        path: filePath,
        name: path$2.basename(filePath),
        size: stats.size,
        type: path$2.extname(filePath).toLowerCase(),
        lastModified: stats.mtime.getTime()
      };
    }));
  });
  ipcMain.handle("get-file-preview", async (_, filePath) => {
    try {
      console.log("Generating preview for:", filePath);
      const data = await fs$2.readFile(filePath);
      const ext = path$2.extname(filePath).toLowerCase().substring(1);
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
  ipcMain.handle("search-media", async (_event, criteria) => {
    try {
      return await dbOperations.searchMedia(criteria);
    } catch (error) {
      console.error("Error searching media:", error);
      return [];
    }
  });
  ipcMain.handle("get-media-details", async (_event, id) => {
    try {
      return await dbOperations.getMediaDetails(id);
    } catch (error) {
      console.error("Error fetching media details:", error);
      return null;
    }
  });
  ipcMain.handle("update-media-details", async (_event, payload) => {
    try {
      const updated = await dbOperations.updateMediaWithRelations(payload.id, {
        title: payload.title,
        description: payload.description,
        capture_date: payload.captureDate || null,
        location: payload.location || null,
        collection: payload.collection || null,
        tags: payload.tags || [],
        people: payload.people || [],
        media_type_id: payload.mediaTypeId ? Number(payload.mediaTypeId) : null
      });
      return { success: true, media: updated };
    } catch (error) {
      console.error("Error updating media details:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });
  ipcMain.handle("save-media", async (_, data) => {
    try {
      console.log("Saving media:", data);
      const processedFile = await processMediaFile(data.filePath, path$2.basename(data.filePath));
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
        collection_id: null
        // Will be set below
      };
      if (data.metadata.collection) {
        const collection = data.metadata.collection;
        const collectionId = collection.id < 0 ? await dbOperations.addCollection(collection.name, collection.description || "") : collection.id;
        mediaData.collection_id = collectionId;
      } else if (data.metadata.collectionId) {
        mediaData.collection_id = parseInt(data.metadata.collectionId);
      }
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
          if (!(person == null ? void 0 : person.name)) continue;
          const resolvedId = typeof person.id !== "number" || person.id < 0 ? await dbOperations.addPerson(person.name) : Number(person.id);
          await dbOperations.linkPersonToMedia(mediaId, resolvedId);
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
    icon: path$2.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$2.join(currentDir, "preload.js"),
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
    win.loadFile(path$2.join(RENDERER_DIST, "index.html"));
  }
}
app$2.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app$2.quit();
    win = null;
  }
});
app$2.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app$2.whenReady().then(async () => {
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
