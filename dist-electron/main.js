import V, { app as R, BrowserWindow as j, ipcMain as E, dialog as v } from "electron";
import le, { fileURLToPath as x } from "url";
import s from "path";
import h from "fs/promises";
import J from "fs";
import de from "better-sqlite3";
function q(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
const { app: W } = V, T = s, S = J, k = "Memory Vault Archive", z = "memoryvault.db";
function D() {
  return W.isPackaged ? T.dirname(process.execPath) : T.join(W.getPath("userData"), "MemoryVault");
}
function A() {
  const e = D();
  return S.existsSync(e) || S.mkdirSync(e, { recursive: !0 }), e;
}
function pe() {
  const e = A(), t = T.join(e, k);
  return S.existsSync(t) || S.mkdirSync(t, { recursive: !0 }), t;
}
function me(e) {
  if (!e) return null;
  const r = (e.startsWith("file://") ? new URL(e).pathname : e).replace(/\\/g, "/");
  return T.isAbsolute(r) ? r : T.join(D(), r);
}
function ue() {
  const e = A();
  return T.join(e, z);
}
var M = {
  ARCHIVE_FOLDER_NAME: k,
  DATABASE_FILENAME: z,
  resolveStorageRoot: D,
  ensureStorageRoot: A,
  ensureArchiveDirectory: pe,
  getDatabasePath: ue,
  resolveArchiveFilePath: me
};
const B = /* @__PURE__ */ q(M), {
  ensureArchiveDirectory: Ee,
  getDatabasePath: ge
} = B, fe = import.meta.url, $ = s.dirname(x(fe));
async function he() {
  try {
    console.log("Process cwd:", process.cwd()), console.log("Current directory:", $);
    const t = (await import("better-sqlite3")).default;
    Ee();
    const r = ge();
    console.log(`Testing database at: ${r}`);
    try {
      const i = await h.stat(r);
      console.log("Database file exists, size:", i.size);
    } catch {
      console.log("Database file does not exist, will create it");
      try {
        await h.mkdir(s.dirname(r), { recursive: !0 }), console.log("Created database directory");
      } catch (o) {
        if (o instanceof Error && "code" in o && o.code !== "EEXIST")
          throw console.error("Failed to create database directory:", o), o;
      }
    }
    const a = new t(r);
    console.log("Database connection established successfully"), a.pragma("foreign_keys = ON");
    try {
      const i = a.prepare("SELECT COUNT(*) as count FROM sqlite_master").get();
      if (console.log("Database query successful:", i), i.count === 0) {
        console.log("Database is empty, creating tables...");
        try {
          const o = process.resourcesPath ?? "", c = [
            s.resolve($, "..", "resources", "create-database.sql"),
            s.resolve(process.cwd(), "resources", "create-database.sql"),
            o ? s.join(o, "create-database.sql") : ""
          ], g = await Te(c);
          if (!g)
            return console.warn("Could not locate create-database.sql"), !1;
          console.log("Loading SQL file from:", g);
          const u = await h.readFile(g, "utf8");
          console.log("SQL file loaded, length:", u.length), a.exec(u), console.log("Database tables created successfully");
        } catch (o) {
          console.error("Failed to create database tables:", o);
        }
      }
    } catch (i) {
      console.error("Query failed:", i);
    }
    return !0;
  } catch (e) {
    return console.error("Database test failed:", e), !1;
  }
}
async function Te(e) {
  for (const t of e)
    if (t)
      try {
        if ((await h.stat(t)).isFile())
          return t;
      } catch {
      }
  return null;
}
const { app: _e } = V, _ = s, O = J, Oe = de, { pathToFileURL: H } = le, Ne = M, {
  ensureStorageRoot: Re,
  ensureArchiveDirectory: Se,
  getDatabasePath: ye,
  resolveArchiveFilePath: Ie
} = Ne;
function U(e) {
  return Ie(e);
}
function Le() {
  const e = [
    _.join(process.cwd(), "resources", "create-database.sql"),
    _.join(_e.getAppPath(), "resources", "create-database.sql"),
    _.join(process.resourcesPath || "", "create-database.sql")
  ];
  for (const t of e)
    if (t && O.existsSync(t))
      return t;
  return null;
}
let n;
try {
  Re(), Se();
  const e = ye(), t = _.dirname(e);
  console.log(`Database path: ${e}`), O.existsSync(t) || O.mkdirSync(t, { recursive: !0 }), n = new Oe(e), n.pragma("foreign_keys = ON");
  const r = Le();
  if (r) {
    const a = O.readFileSync(r, "utf8");
    n.exec(a), console.log("Database schema initialized");
  } else
    console.warn("Database schema file not found. Skipping initialization script.");
  Ce(), console.log("Database connection established successfully");
} catch (e) {
  console.error("Error connecting to database:", e), n = null;
}
function Ce() {
  try {
    if (!n) return;
    if (n.prepare("SELECT COUNT(*) as count FROM MediaTypes").get().count === 0) {
      const a = [
        "Image",
        "Video",
        "Document",
        "Audio"
      ], i = n.prepare("INSERT INTO MediaTypes (name) VALUES (?)");
      a.forEach((o) => i.run(o)), console.log("Initialized default media types");
    }
    if (n.prepare("SELECT COUNT(*) as count FROM SourceTypes").get().count === 0) {
      const a = [
        "Digital Camera",
        "Phone",
        "Scanned Photo",
        "Scanned Document",
        "Internet",
        "Other"
      ], i = n.prepare("INSERT INTO SourceTypes (name) VALUES (?)");
      a.forEach((o) => i.run(o)), console.log("Initialized default source types");
    }
    n.prepare("SELECT COUNT(*) as count FROM Collections").get().count === 0 && (n.prepare("INSERT INTO Collections (name, description) VALUES (?, ?)").run("General", "Default collection for uncategorized media"), console.log("Created default collection"));
  } catch (e) {
    console.error("Error initializing default values:", e);
  }
}
function we() {
  try {
    return n ? n.prepare(`
      SELECT m.*, mt.name as media_type, st.name as source_type, c.name as collection_name
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      ORDER BY m.created_at DESC
    `).all() : [];
  } catch (e) {
    return console.error("Error getting all media:", e), [];
  }
}
function De(e) {
  try {
    if (!n) throw new Error("Database not initialized");
    return n.prepare(`
      INSERT INTO Media (
        file_name, file_path, thumbnail_path, title, description,
        media_type_id, source_type_id, capture_date, location, collection_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      e.file_name,
      e.file_path,
      e.thumbnail_path,
      e.title,
      e.description,
      e.media_type_id,
      e.source_type_id,
      e.capture_date,
      e.location,
      e.collection_id
    ).lastInsertRowid;
  } catch (t) {
    throw console.error("Error adding media:", t), t;
  }
}
function Ae({ searchTerm: e, titleTerm: t, locationTerm: r, peopleText: a, tagsText: i }) {
  const o = [], c = [];
  if (e) {
    const u = `%${e}%`;
    o.push("CASE WHEN LOWER(m.title) LIKE ? THEN 5 ELSE 0 END"), c.push(u), o.push("CASE WHEN LOWER(m.description) LIKE ? THEN 3 ELSE 0 END"), c.push(u), o.push("CASE WHEN LOWER(m.location) LIKE ? THEN 2 ELSE 0 END"), c.push(u);
  }
  if (t && (o.push("CASE WHEN LOWER(m.title) LIKE ? THEN 4 ELSE 0 END"), c.push(`%${t}%`)), r && (o.push("CASE WHEN LOWER(m.location) LIKE ? THEN 2 ELSE 0 END"), c.push(`%${r}%`)), a)
    o.push("CASE WHEN EXISTS (SELECT 1 FROM MediaPeople mp JOIN People p ON p.id = mp.person_id WHERE mp.media_id = m.id AND LOWER(p.name) LIKE ?) THEN 3 ELSE 0 END"), c.push(`%${a}%`);
  else if (e) {
    const u = `%${e}%`;
    o.push("CASE WHEN EXISTS (SELECT 1 FROM MediaPeople mp JOIN People p ON p.id = mp.person_id WHERE mp.media_id = m.id AND LOWER(p.name) LIKE ?) THEN 2 ELSE 0 END"), c.push(u);
  }
  return i && (o.push("CASE WHEN EXISTS (SELECT 1 FROM MediaTags mt2 JOIN Tags t2 ON t2.id = mt2.tag_id WHERE mt2.media_id = m.id AND LOWER(t2.name) LIKE ?) THEN 2 ELSE 0 END"), c.push(`%${i}%`)), { relevanceSql: o.length > 0 ? o.join(" + ") : "0", relevanceParams: c };
}
function G(e) {
  const t = U(e.file_path), r = U(e.thumbnail_path);
  return {
    ...e,
    media_type: e.media_type,
    collection_name: e.collection_name,
    tags: e.tags ? e.tags.split("|").filter(Boolean) : [],
    people: e.people ? e.people.split("|").filter(Boolean) : [],
    file_path: t || e.file_path,
    file_url: t ? H(t).href : null,
    thumbnail_path: r || e.thumbnail_path,
    thumbnail_url: r ? H(r).href : null
  };
}
function Me(e = {}) {
  try {
    if (!n) return [];
    const {
      text: t,
      title: r,
      location: a,
      mediaTypeIds: i = [],
      collectionIds: o = [],
      tagIds: c = [],
      personIds: g = [],
      dateFrom: u,
      dateTo: P,
      peopleText: b,
      tagsText: F,
      sort: oe = "newest",
      limit: ne = 25,
      offset: ae = 0
    } = e, y = t ? t.toLowerCase().trim() : "", I = r ? r.toLowerCase().trim() : "", L = a ? a.toLowerCase().trim() : "", C = b ? b.toLowerCase().trim() : "", w = F ? F.toLowerCase().trim() : "", { relevanceSql: ie, relevanceParams: se } = Ae({
      searchTerm: y,
      titleTerm: I,
      locationTerm: L,
      peopleText: C,
      tagsText: w
    });
    let l = `
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
        ${ie} as relevance
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
    const d = [...se];
    if (y) {
      const m = `%${y}%`;
      l += " AND (LOWER(m.title) LIKE ? OR LOWER(m.description) LIKE ? OR LOWER(m.location) LIKE ? OR EXISTS (SELECT 1 FROM MediaPeople mp2 JOIN People p2 ON p2.id = mp2.person_id WHERE mp2.media_id = m.id AND LOWER(p2.name) LIKE ?))", d.push(m, m, m, m);
    }
    if (I && (l += " AND LOWER(m.title) LIKE ?", d.push(`%${I}%`)), L && (l += " AND LOWER(m.location) LIKE ?", d.push(`%${L}%`)), i.length > 0) {
      const m = i.map(() => "?").join(",");
      l += ` AND m.media_type_id IN (${m})`, d.push(...i);
    }
    if (o.length > 0) {
      const m = o.map(() => "?").join(",");
      l += ` AND m.collection_id IN (${m})`, d.push(...o);
    }
    if (u && (l += " AND m.capture_date >= ?", d.push(u)), P && (l += " AND m.capture_date <= ?", d.push(P)), c.length > 0) {
      const m = c.map(() => "?").join(",");
      l += `
        AND m.id IN (
          SELECT media_id
          FROM MediaTags
          WHERE tag_id IN (${m})
          GROUP BY media_id
          HAVING COUNT(DISTINCT tag_id) = ?
        )
      `, d.push(...c, c.length);
    }
    if (g.length > 0) {
      const m = g.map(() => "?").join(",");
      l += `
        AND m.id IN (
          SELECT media_id
          FROM MediaPeople
          WHERE person_id IN (${m})
          GROUP BY media_id
          HAVING COUNT(DISTINCT person_id) = ?
        )
      `, d.push(...g, g.length);
    }
    C && (l += " AND EXISTS (SELECT 1 FROM MediaPeople mp2 JOIN People p2 ON p2.id = mp2.person_id WHERE mp2.media_id = m.id AND LOWER(p2.name) LIKE ?)", d.push(`%${C}%`)), w && (l += " AND EXISTS (SELECT 1 FROM MediaTags mt2 JOIN Tags t2 ON t2.id = mt2.tag_id WHERE mt2.media_id = m.id AND LOWER(t2.name) LIKE ?)", d.push(`%${w}%`)), l += " GROUP BY m.id";
    const ce = (() => {
      switch (oe) {
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
    return l += ` ORDER BY ${ce}`, l += " LIMIT ? OFFSET ?", d.push(ne, ae), n.prepare(l).all(...d).map(G);
  } catch (t) {
    return console.error("Error searching media:", t), [];
  }
}
function K(e) {
  try {
    if (!n) return null;
    const r = n.prepare(`
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
    `).get(e);
    return r ? G(r) : null;
  } catch (t) {
    return console.error("Error getting media details:", t), null;
  }
}
function Pe(e) {
  if (e == null || e === "") return null;
  if (typeof e == "number") return e;
  const t = n.prepare("SELECT id FROM Collections WHERE LOWER(name) = LOWER(?)").get(e);
  return t ? t.id : Q(e, "");
}
function be(e, t = []) {
  if (n.prepare("DELETE FROM MediaTags WHERE media_id = ?").run(e), !t || t.length === 0) return;
  const r = n.prepare("INSERT OR IGNORE INTO MediaTags (media_id, tag_id) VALUES (?, ?)");
  t.forEach((a) => {
    const i = Y(a);
    r.run(e, i);
  });
}
function Fe(e, t = []) {
  if (n.prepare("DELETE FROM MediaPeople WHERE media_id = ?").run(e), !t || t.length === 0) return;
  const r = n.prepare("INSERT OR IGNORE INTO MediaPeople (media_id, person_id) VALUES (?, ?)");
  t.forEach((a) => {
    const i = X(a);
    r.run(e, i);
  });
}
function ve(e, t) {
  try {
    if (!n) throw new Error("Database not initialized");
    n.prepare("BEGIN").run();
    const r = Pe(t.collection);
    return n.prepare(`
      UPDATE Media SET
        title = ?,
        description = ?,
        capture_date = ?,
        location = ?,
        collection_id = ?,
        media_type_id = COALESCE(?, media_type_id)
      WHERE id = ?
    `).run(
      t.title,
      t.description,
      t.capture_date || null,
      t.location || null,
      r,
      t.media_type_id || null,
      e
    ), be(e, t.tags || []), Fe(e, t.people || []), n.prepare("COMMIT").run(), K(e);
  } catch (r) {
    throw n == null || n.prepare("ROLLBACK").run(), console.error("Error updating media with relations:", r), r;
  }
}
function We() {
  try {
    return n ? n.prepare("SELECT * FROM MediaTypes ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting media types:", e), [];
  }
}
function $e() {
  try {
    return n ? n.prepare("SELECT * FROM SourceTypes ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting source types:", e), [];
  }
}
function He() {
  try {
    return n ? n.prepare("SELECT * FROM Collections ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting collections:", e), [];
  }
}
function Ue() {
  try {
    return n ? n.prepare("SELECT * FROM Tags ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting tags:", e), [];
  }
}
function Ve() {
  try {
    return n ? n.prepare("SELECT * FROM People ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting people:", e), [];
  }
}
function Y(e) {
  try {
    if (!n) throw new Error("Database not initialized");
    const t = n.prepare("SELECT id FROM Tags WHERE name = ?").get(e);
    return t ? t.id : n.prepare("INSERT INTO Tags (name) VALUES (?)").run(e).lastInsertRowid;
  } catch (t) {
    throw console.error("Error adding tag:", t), t;
  }
}
function X(e) {
  try {
    if (!n) throw new Error("Database not initialized");
    const t = n.prepare("SELECT id FROM People WHERE name = ?").get(e);
    return t ? t.id : n.prepare("INSERT INTO People (name) VALUES (?)").run(e).lastInsertRowid;
  } catch (t) {
    throw console.error("Error adding person:", t), t;
  }
}
function je(e, t) {
  try {
    if (!n) throw new Error("Database not initialized");
    return n.prepare("INSERT OR IGNORE INTO MediaTags (media_id, tag_id) VALUES (?, ?)").run(e, t), !0;
  } catch (r) {
    throw console.error("Error linking tag to media:", r), r;
  }
}
function xe(e, t) {
  try {
    if (!n) throw new Error("Database not initialized");
    return n.prepare("INSERT OR IGNORE INTO MediaPeople (media_id, person_id) VALUES (?, ?)").run(e, t), !0;
  } catch (r) {
    throw console.error("Error linking person to media:", r), r;
  }
}
function Q(e, t = "") {
  try {
    if (!n) throw new Error("Database not initialized");
    const r = n.prepare("SELECT id FROM Collections WHERE name = ?").get(e);
    return r ? r.id : n.prepare("INSERT INTO Collections (name, description) VALUES (?, ?)").run(e, t).lastInsertRowid;
  } catch (r) {
    throw console.error("Error adding collection:", r), r;
  }
}
var Je = {
  getAllMedia: we,
  addMedia: De,
  searchMedia: Me,
  getMediaDetails: K,
  getMediaTypes: We,
  getSourceTypes: $e,
  getCollections: He,
  getTags: Ue,
  getPeople: Ve,
  addTag: Y,
  addPerson: X,
  linkTagToMedia: je,
  linkPersonToMedia: xe,
  addCollection: Q,
  updateMediaWithRelations: ve
};
const p = /* @__PURE__ */ q(Je), {
  ensureStorageRoot: at,
  ensureArchiveDirectory: qe,
  ARCHIVE_FOLDER_NAME: ke
} = B;
async function Z() {
  try {
    return { mediaDir: qe() };
  } catch (e) {
    throw console.error("Error creating directories:", e), e;
  }
}
function ze(e) {
  const t = Date.now(), r = Math.random().toString(36).substring(2, 8), a = s.extname(e);
  return `${s.basename(e, a)}_${t}_${r}${a}`;
}
async function Be(e, t) {
  try {
    const { mediaDir: r } = await Z(), a = ze(t), i = s.join(r, a);
    return await h.copyFile(e, i), {
      filePath: i,
      fileName: a,
      relativePath: s.join(ke, a)
    };
  } catch (r) {
    throw console.error("Error saving media file:", r), r;
  }
}
async function Ge(e, t) {
  try {
    return {
      ...await Be(e, t),
      thumbnail: null
      // No thumbnail
    };
  } catch (r) {
    throw console.error("Error processing media file:", r), r;
  }
}
const Ke = import.meta.url, ee = s.dirname(x(Ke));
process.env.APP_ROOT = s.join(ee, "..");
const N = process.env.VITE_DEV_SERVER_URL, it = s.join(process.env.APP_ROOT, "dist-electron"), te = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = N ? s.join(process.env.APP_ROOT, "public") : te;
function Ye() {
  E.handle("select-files", async () => {
    console.log("Showing file dialog...");
    const { canceled: e, filePaths: t } = await v.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Media Files", extensions: ["jpg", "jpeg", "png", "gif", "mp4", "pdf", "doc", "docx"] }
      ]
    });
    return e ? [] : Promise.all(t.map(async (r) => {
      const a = await h.stat(r);
      return {
        path: r,
        name: s.basename(r),
        size: a.size,
        type: s.extname(r).toLowerCase(),
        lastModified: a.mtime.getTime()
      };
    }));
  }), E.handle("get-file-preview", async (e, t) => {
    try {
      console.log("Generating preview for:", t);
      const r = await h.readFile(t), a = s.extname(t).toLowerCase().substring(1), i = r.toString("base64");
      let o = "application/octet-stream";
      return ["jpg", "jpeg"].includes(a) ? o = "image/jpeg" : a === "png" ? o = "image/png" : a === "gif" ? o = "image/gif" : a === "pdf" ? o = "application/pdf" : a === "mp4" && (o = "video/mp4"), console.log("Preview generated with mime type:", o), {
        dataUrl: `data:${o};base64,${i}`,
        mimeType: o
      };
    } catch (r) {
      return console.error("Error reading file:", r), null;
    }
  }), E.handle("get-media-types", async () => {
    try {
      const e = await p.getMediaTypes();
      return console.log("Media types from database:", e), e.length > 0 ? e : [
        { id: 1, name: "Image" },
        { id: 2, name: "Video" },
        { id: 3, name: "Document" },
        { id: 4, name: "Audio" }
      ];
    } catch (e) {
      return console.error("Error getting media types:", e), [
        { id: 1, name: "Image" },
        { id: 2, name: "Video" },
        { id: 3, name: "Document" },
        { id: 4, name: "Audio" }
      ];
    }
  }), E.handle("get-collections", async () => {
    try {
      return await p.getCollections();
    } catch (e) {
      return console.error("Error getting collections:", e), [
        { id: 1, name: "Family Vacation 2023" },
        { id: 2, name: "Wedding Anniversary" },
        { id: 3, name: "Birthday Party" }
      ];
    }
  }), E.handle("get-tags", async () => {
    try {
      return await p.getTags();
    } catch (e) {
      return console.error("Error getting tags:", e), [
        { id: 1, name: "family" },
        { id: 2, name: "vacation" },
        { id: 3, name: "birthday" }
      ];
    }
  }), E.handle("get-people", async () => {
    try {
      return await p.getPeople();
    } catch (e) {
      return console.error("Error getting people:", e), [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Jane Smith" },
        { id: 3, name: "Alex Johnson" }
      ];
    }
  }), E.handle("search-media", async (e, t) => {
    try {
      return await p.searchMedia(t);
    } catch (r) {
      return console.error("Error searching media:", r), [];
    }
  }), E.handle("get-media-details", async (e, t) => {
    try {
      return await p.getMediaDetails(t);
    } catch (r) {
      return console.error("Error fetching media details:", r), null;
    }
  }), E.handle("update-media-details", async (e, t) => {
    try {
      return { success: !0, media: await p.updateMediaWithRelations(t.id, {
        title: t.title,
        description: t.description,
        capture_date: t.captureDate || null,
        location: t.location || null,
        collection: t.collection || null,
        tags: t.tags || [],
        people: t.people || [],
        media_type_id: t.mediaTypeId ? Number(t.mediaTypeId) : null
      }) };
    } catch (r) {
      return console.error("Error updating media details:", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), E.handle("download-media-file", async (e, t) => {
    try {
      const r = M.resolveArchiveFilePath(t.filePath);
      if (!r)
        throw new Error("File path was not provided.");
      const a = t.defaultFileName || s.basename(r), { canceled: i, filePath: o } = await v.showSaveDialog({
        defaultPath: a,
        title: "Save media as"
      });
      return i || !o ? { success: !1, canceled: !0 } : (await h.copyFile(r, o), { success: !0 });
    } catch (r) {
      return console.error("Error downloading media file:", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), E.handle("save-media", async (e, t) => {
    try {
      console.log("Saving media:", t);
      const r = await Ge(t.filePath, s.basename(t.filePath)), a = {
        file_name: r.fileName,
        file_path: r.relativePath,
        thumbnail_path: null,
        title: t.metadata.title,
        description: t.metadata.description,
        media_type_id: parseInt(t.metadata.mediaTypeId),
        source_type_id: t.metadata.sourceTypeId ? parseInt(t.metadata.sourceTypeId) : null,
        capture_date: t.metadata.captureDate || null,
        location: t.metadata.location || null,
        collection_id: null
        // Will be set below
      };
      if (t.metadata.collection) {
        const o = t.metadata.collection, c = o.id < 0 ? await p.addCollection(o.name, o.description || "") : o.id;
        a.collection_id = c;
      } else t.metadata.collectionId && (a.collection_id = parseInt(t.metadata.collectionId));
      const i = await p.addMedia(a);
      if (console.log(`Media saved with ID: ${i}`), t.metadata.tags && t.metadata.tags.length > 0)
        for (const o of t.metadata.tags) {
          const c = o.id < 0 ? await p.addTag(o.name) : o.id;
          await p.linkTagToMedia(i, c);
        }
      if (t.metadata.people && t.metadata.people.length > 0)
        for (const o of t.metadata.people) {
          if (!(o != null && o.name)) continue;
          const c = typeof o.id != "number" || o.id < 0 ? await p.addPerson(o.name) : Number(o.id);
          await p.linkPersonToMedia(i, c);
        }
      return { success: !0, mediaId: i };
    } catch (r) {
      return console.error("Error saving media:", r), {
        success: !1,
        error: r instanceof Error ? r.message : "Unknown error occurred"
      };
    }
  });
}
let f;
function re() {
  f = new j({
    icon: s.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: s.join(ee, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    width: 1200,
    height: 800
  }), N && f.webContents.openDevTools(), f.webContents.on("did-finish-load", () => {
    f == null || f.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), N ? f.loadURL(N) : f.loadFile(s.join(te, "index.html"));
}
R.on("window-all-closed", () => {
  process.platform !== "darwin" && (R.quit(), f = null);
});
R.on("activate", () => {
  j.getAllWindows().length === 0 && re();
});
R.whenReady().then(async () => {
  try {
    const e = await he();
    console.log("Database test result:", e), await Z(), Ye(), re(), console.log("App initialized successfully");
  } catch (e) {
    console.error("Error during app initialization:", e);
  }
});
export {
  it as MAIN_DIST,
  te as RENDERER_DIST,
  N as VITE_DEV_SERVER_URL
};
//# sourceMappingURL=main.js.map
