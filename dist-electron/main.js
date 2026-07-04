import De, { ipcMain as d, BrowserWindow as re, app as N, shell as ue, dialog as z } from "electron";
import Pe, { fileURLToPath as Fe } from "url";
import s from "path";
import E from "fs/promises";
import Ue from "fs";
import Nt from "better-sqlite3";
import { autoUpdater as O } from "electron-updater";
function We(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
const { app: me } = De, T = s, L = Ue, { fileURLToPath: Tt } = Pe, Lt = "Memory Vault Library", ae = "Memory Vault Archive", ne = "memoryvault.db", ke = "memory-vault-settings.json";
function fe() {
  return T.join(me.getPath("userData"), ke);
}
function oe() {
  try {
    const e = fe();
    return L.existsSync(e) ? JSON.parse(L.readFileSync(e, "utf8")) || {} : {};
  } catch (e) {
    return console.warn("Unable to read Memory Vault settings:", e), {};
  }
}
function ge(e) {
  const t = fe();
  L.mkdirSync(T.dirname(t), { recursive: !0 }), L.writeFileSync(t, `${JSON.stringify(e, null, 2)}
`, "utf8");
}
function He(e) {
  return e ? L.existsSync(T.join(e, ne)) && L.existsSync(T.join(e, ae)) : !1;
}
function St(e) {
  try {
    return !L.existsSync(e) || !L.statSync(e).isDirectory() ? !1 : L.readdirSync(e).length > 0;
  } catch {
    return !1;
  }
}
function $e(e) {
  if (!e) return !1;
  if (He(e)) return !0;
  const t = T.join(e, ne);
  if (L.existsSync(t)) return !0;
  const r = T.join(e, ae);
  return St(r);
}
function Ve() {
  const e = [
    T.join(me.getPath("userData"), "MemoryVault")
  ];
  return me.isPackaged && e.push(T.dirname(process.execPath)), Array.from(new Set(e.map((t) => T.normalize(t))));
}
function Be() {
  const e = oe();
  if (e.activeLibraryPath) return e.activeLibraryPath;
  const t = Ve().find($e);
  return t ? (ge({ ...e, activeLibraryPath: t }), t) : null;
}
function je({ adoptLegacy: e = !0 } = {}) {
  const t = oe();
  return t.activeLibraryPath ? t.activeLibraryPath : e ? Be() : null;
}
function Ot(e) {
  const t = oe(), r = T.normalize(e);
  return ge({ ...t, activeLibraryPath: r }), r;
}
function ye() {
  const e = je();
  if (!e)
    throw new Error("No Memory Vault Library has been selected yet.");
  return e;
}
function _e() {
  const e = ye();
  return L.existsSync(e) || L.mkdirSync(e, { recursive: !0 }), e;
}
function Rt() {
  const e = _e(), t = T.join(e, ae);
  return L.existsSync(t) || L.mkdirSync(t, { recursive: !0 }), t;
}
function Ct(e) {
  if (!e) return null;
  const r = (e.startsWith("file://") ? Tt(e) : e).replace(/\\/g, "/");
  return T.isAbsolute(r) ? r : T.join(ye(), r);
}
function Mt() {
  const e = _e();
  return T.join(e, ne);
}
var ze = {
  LIBRARY_FOLDER_NAME: Lt,
  ARCHIVE_FOLDER_NAME: ae,
  DATABASE_FILENAME: ne,
  SETTINGS_FILENAME: ke,
  getSettingsPath: fe,
  readSettings: oe,
  writeSettings: ge,
  looksLikeLibrary: He,
  isAdoptableLegacyLibrary: $e,
  getLegacyVaultCandidates: Ve,
  adoptLegacyLibraryIfPresent: Be,
  getActiveLibraryPath: je,
  setActiveLibraryPath: Ot,
  resolveStorageRoot: ye,
  ensureStorageRoot: _e,
  ensureArchiveDirectory: Rt,
  getDatabasePath: Mt,
  resolveArchiveFilePath: Ct
};
const Ne = /* @__PURE__ */ We(ze), { app: wt } = De, q = s, K = Ue, It = Nt, { pathToFileURL: Q } = Pe, bt = ze, {
  ensureStorageRoot: vt,
  ensureArchiveDirectory: At,
  getDatabasePath: Dt,
  resolveArchiveFilePath: Pt
} = bt, F = ["general", "unfiled memories", "ungrouped memories"], ie = "ungrouped", Ft = "Ungrouped Memories", Ut = "Memories without a collection.", Wt = process.env.MEMORY_VAULT_DEBUG === "1";
function b(...e) {
  Wt && console.log(...e);
}
function kt(e) {
  return String(e || "").trim().toLowerCase();
}
function Te(e) {
  return F.includes(kt(e));
}
function se() {
  return F.map(() => "?").join(",");
}
function Z(e) {
  return Pt(e);
}
function Ht() {
  const e = [
    q.join(process.cwd(), "resources", "create-database.sql"),
    q.join(wt.getAppPath(), "resources", "create-database.sql"),
    q.join(process.resourcesPath || "", "create-database.sql")
  ];
  for (const t of e)
    if (t && K.existsSync(t))
      return t;
  return null;
}
let a = null;
function S() {
  if (a) return a;
  try {
    vt(), At();
    const e = Dt(), t = q.dirname(e);
    b(`Database path: ${e}`), K.existsSync(t) || K.mkdirSync(t, { recursive: !0 }), a = new It(e), a.pragma("foreign_keys = ON");
    const r = Ht();
    if (r) {
      const n = K.readFileSync(r, "utf8");
      a.exec(n), b("Database schema initialized");
    } else
      console.warn("Database schema file not found. Skipping initialization script.");
    return xt(), b("Database connection established successfully"), a;
  } catch (e) {
    throw console.error("Error connecting to database:", e), a = null, e;
  }
}
function $t() {
  a && (a.close(), a = null);
}
function Vt() {
  a.prepare("PRAGMA table_info(Media)").all().some((r) => r.name === "notes") || (a.prepare("ALTER TABLE Media ADD COLUMN notes TEXT").run(), b("Added notes column to Media table"));
}
function Bt() {
  a.prepare("PRAGMA table_info(Comments)").all().some((r) => r.name === "author_name") || (a.prepare("ALTER TABLE Comments ADD COLUMN author_name TEXT").run(), b("Added author_name column to Comments table"));
}
function jt() {
  if (!a.prepare("PRAGMA table_info(Media)").all().some((n) => n.name === "notes")) return;
  const r = a.prepare(`
    INSERT INTO Comments (media_id, author_name, content)
    SELECT m.id, NULL, TRIM(m.notes)
    FROM Media m
    WHERE m.notes IS NOT NULL
      AND TRIM(m.notes) != ''
      AND NOT EXISTS (
        SELECT 1
        FROM Comments c
        WHERE c.media_id = m.id
          AND TRIM(c.content) = TRIM(m.notes)
      )
  `).run();
  r.changes > 0 && b(`Migrated ${r.changes} Media.notes value(s) into Memory Notes`);
}
function zt() {
  const e = se(), t = a.prepare(`
    SELECT id, name
    FROM Collections
    WHERE LOWER(TRIM(name)) IN (${e})
  `).all(...F);
  if (t.length === 0) return;
  const r = t.map((o) => o.id), n = r.map(() => "?").join(",");
  a.prepare(`UPDATE Media SET collection_id = NULL WHERE collection_id IN (${n})`).run(...r), a.prepare(`DELETE FROM Collections WHERE id IN (${n})`).run(...r), b(`Migrated ${t.length} legacy default collection(s) to ungrouped media`);
}
function xt() {
  try {
    if (a || S(), Vt(), Bt(), jt(), a.prepare("SELECT COUNT(*) as count FROM MediaTypes").get().count === 0) {
      const r = [
        "Image",
        "Video",
        "Document",
        "Audio"
      ], n = a.prepare("INSERT INTO MediaTypes (name) VALUES (?)");
      r.forEach((o) => n.run(o)), b("Initialized default media types");
    }
    if (a.prepare("SELECT COUNT(*) as count FROM SourceTypes").get().count === 0) {
      const r = [
        "Digital Camera",
        "Phone",
        "Scanned Photo",
        "Scanned Document",
        "Internet",
        "Other"
      ], n = a.prepare("INSERT INTO SourceTypes (name) VALUES (?)");
      r.forEach((o) => n.run(o)), b("Initialized default source types");
    }
    zt();
  } catch (e) {
    console.error("Error initializing default values:", e);
  }
}
function Jt() {
  try {
    return a ? a.prepare(`
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
function Yt(e) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    return a.prepare(`
      INSERT INTO Media (
        file_name, file_path, thumbnail_path, title, description, notes,
        media_type_id, source_type_id, capture_date, location, collection_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      e.file_name,
      e.file_path,
      e.thumbnail_path,
      e.title,
      e.description,
      e.notes || null,
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
function Gt({ searchTerm: e, titleTerm: t, locationTerm: r, peopleText: n, tagsText: o }) {
  const i = [], l = [];
  if (e) {
    const u = `%${e}%`;
    i.push("CASE WHEN LOWER(m.title) LIKE ? THEN 5 ELSE 0 END"), l.push(u), i.push("CASE WHEN LOWER(m.description) LIKE ? THEN 3 ELSE 0 END"), l.push(u), i.push("CASE WHEN EXISTS (SELECT 1 FROM Comments c_notes WHERE c_notes.media_id = m.id AND (LOWER(c_notes.content) LIKE ? OR LOWER(c_notes.author_name) LIKE ?)) THEN 3 ELSE 0 END"), l.push(u, u), i.push("CASE WHEN LOWER(m.location) LIKE ? THEN 2 ELSE 0 END"), l.push(u);
  }
  if (t && (i.push("CASE WHEN LOWER(m.title) LIKE ? THEN 4 ELSE 0 END"), l.push(`%${t}%`)), r && (i.push("CASE WHEN LOWER(m.location) LIKE ? THEN 2 ELSE 0 END"), l.push(`%${r}%`)), n)
    i.push("CASE WHEN EXISTS (SELECT 1 FROM MediaPeople mp JOIN People p ON p.id = mp.person_id WHERE mp.media_id = m.id AND LOWER(p.name) LIKE ?) THEN 3 ELSE 0 END"), l.push(`%${n}%`);
  else if (e) {
    const u = `%${e}%`;
    i.push("CASE WHEN EXISTS (SELECT 1 FROM MediaPeople mp JOIN People p ON p.id = mp.person_id WHERE mp.media_id = m.id AND LOWER(p.name) LIKE ?) THEN 2 ELSE 0 END"), l.push(u);
  }
  return o && (i.push("CASE WHEN EXISTS (SELECT 1 FROM MediaTags mt2 JOIN Tags t2 ON t2.id = mt2.tag_id WHERE mt2.media_id = m.id AND LOWER(t2.name) LIKE ?) THEN 2 ELSE 0 END"), l.push(`%${o}%`)), { relevanceSql: i.length > 0 ? i.join(" + ") : "0", relevanceParams: l };
}
function xe(e) {
  const t = Z(e.file_path), r = Z(e.thumbnail_path);
  return {
    ...e,
    media_type: e.media_type,
    collection_name: e.collection_name,
    tags: e.tags ? e.tags.split("|").filter(Boolean) : [],
    people: e.people ? e.people.split("|").filter(Boolean) : [],
    file_path: t || e.file_path,
    file_url: t ? Q(t).href : null,
    thumbnail_path: r || e.thumbnail_path,
    thumbnail_url: r ? Q(r).href : null
  };
}
function k(e = {}) {
  try {
    if (!a) return [];
    const {
      text: t,
      title: r,
      location: n,
      mediaTypeIds: o = [],
      collectionIds: i = [],
      tagIds: l = [],
      personIds: p = [],
      dateFrom: u,
      dateTo: R,
      peopleText: v,
      tagsText: W,
      sort: A = "newest",
      limit: H = 25,
      offset: f = 0
    } = e, g = t ? t.toLowerCase().trim() : "", w = r ? r.toLowerCase().trim() : "", D = n ? n.toLowerCase().trim() : "", ce = v ? v.toLowerCase().trim() : "", le = W ? W.toLowerCase().trim() : "", de = Array.isArray(i) ? i.filter(Boolean).map(Number) : [], ft = e.ungrouped === !0, { relevanceSql: gt, relevanceParams: yt } = Gt({
      searchTerm: g,
      titleTerm: w,
      locationTerm: D,
      peopleText: ce,
      tagsText: le
    });
    let h = `
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
        ${gt} as relevance
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
    const y = [...yt];
    if (g) {
      const _ = `%${g}%`;
      h += " AND (LOWER(m.title) LIKE ? OR LOWER(m.description) LIKE ? OR EXISTS (SELECT 1 FROM Comments c_search WHERE c_search.media_id = m.id AND (LOWER(c_search.content) LIKE ? OR LOWER(c_search.author_name) LIKE ?)) OR LOWER(m.location) LIKE ? OR EXISTS (SELECT 1 FROM MediaPeople mp2 JOIN People p2 ON p2.id = mp2.person_id WHERE mp2.media_id = m.id AND LOWER(p2.name) LIKE ?))", y.push(_, _, _, _, _, _);
    }
    if (w && (h += " AND LOWER(m.title) LIKE ?", y.push(`%${w}%`)), D && (h += " AND LOWER(m.location) LIKE ?", y.push(`%${D}%`)), o.length > 0) {
      const _ = o.map(() => "?").join(",");
      h += ` AND m.media_type_id IN (${_})`, y.push(...o);
    }
    if (ft)
      h += ` AND (m.collection_id IS NULL OR LOWER(TRIM(c.name)) IN (${se()}))`, y.push(...F);
    else if (de.length > 0) {
      const _ = de.map(() => "?").join(",");
      h += ` AND m.collection_id IN (${_})`, y.push(...de);
    }
    if (u && (h += " AND m.capture_date >= ?", y.push(u)), R && (h += " AND m.capture_date <= ?", y.push(R)), l.length > 0) {
      const _ = l.map(() => "?").join(",");
      h += `
        AND m.id IN (
          SELECT media_id
          FROM MediaTags
          WHERE tag_id IN (${_})
          GROUP BY media_id
          HAVING COUNT(DISTINCT tag_id) = ?
        )
      `, y.push(...l, l.length);
    }
    if (p.length > 0) {
      const _ = p.map(() => "?").join(",");
      h += `
        AND m.id IN (
          SELECT media_id
          FROM MediaPeople
          WHERE person_id IN (${_})
          GROUP BY media_id
          HAVING COUNT(DISTINCT person_id) = ?
        )
      `, y.push(...p, p.length);
    }
    ce && (h += " AND EXISTS (SELECT 1 FROM MediaPeople mp2 JOIN People p2 ON p2.id = mp2.person_id WHERE mp2.media_id = m.id AND LOWER(p2.name) LIKE ?)", y.push(`%${ce}%`)), le && (h += " AND EXISTS (SELECT 1 FROM MediaTags mt2 JOIN Tags t2 ON t2.id = mt2.tag_id WHERE mt2.media_id = m.id AND LOWER(t2.name) LIKE ?)", y.push(`%${le}%`)), h += " GROUP BY m.id";
    const _t = (() => {
      switch (A) {
        case "oldest":
          return "CASE WHEN m.capture_date IS NULL THEN 1 ELSE 0 END, m.capture_date ASC, m.created_at ASC";
        case "title":
          return "LOWER(m.title) ASC";
        case "type":
          return "LOWER(mt.name) ASC, m.created_at DESC";
        case "uploaded":
          return "m.created_at DESC";
        default:
          return "relevance DESC, CASE WHEN m.capture_date IS NULL THEN 1 ELSE 0 END, m.capture_date DESC, m.created_at DESC";
      }
    })();
    return h += ` ORDER BY ${_t}`, h += " LIMIT ? OFFSET ?", y.push(H, f), a.prepare(h).all(...y).map(xe);
  } catch (t) {
    return console.error("Error searching media:", t), [];
  }
}
function Je(e) {
  return {
    id: e.id,
    media_id: e.media_id,
    author_name: e.author_name || null,
    content: e.content,
    created_at: e.created_at
  };
}
function Ye(e) {
  try {
    return a ? a.prepare(`
      SELECT id, media_id, author_name, content, created_at
      FROM Comments
      WHERE media_id = ?
      ORDER BY datetime(created_at) ASC, id ASC
    `).all(e).map(Je) : [];
  } catch (t) {
    return console.error("Error getting memory notes:", t), [];
  }
}
function qt(e, { authorName: t = "", content: r = "" } = {}) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    const n = String(r || "").trim();
    if (!n) throw new Error("Note content is required");
    const o = String(t || "").trim(), l = a.prepare(`
      INSERT INTO Comments (media_id, author_name, content)
      VALUES (?, ?, ?)
    `).run(Number(e), o || null, n);
    return Je(a.prepare(`
      SELECT id, media_id, author_name, content, created_at
      FROM Comments
      WHERE id = ?
    `).get(l.lastInsertRowid));
  } catch (n) {
    throw console.error("Error adding memory note:", n), n;
  }
}
function Ge(e) {
  try {
    if (!a) return null;
    const r = a.prepare(`
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
    return r ? { ...xe(r), memory_notes: Ye(e) } : null;
  } catch (t) {
    return console.error("Error getting media details:", t), null;
  }
}
function Kt(e) {
  if (e == null || e === "") return null;
  if (typeof e == "number") return e;
  if (Te(e)) return null;
  const t = a.prepare("SELECT id FROM Collections WHERE LOWER(name) = LOWER(?)").get(e);
  return t ? t.id : Qe(e, "");
}
function Xt(e, t = []) {
  if (a.prepare("DELETE FROM MediaTags WHERE media_id = ?").run(e), !t || t.length === 0) return;
  const r = a.prepare("INSERT OR IGNORE INTO MediaTags (media_id, tag_id) VALUES (?, ?)");
  t.forEach((n) => {
    const o = Ke(n);
    r.run(e, o);
  });
}
function Qt(e, t = []) {
  if (a.prepare("DELETE FROM MediaPeople WHERE media_id = ?").run(e), !t || t.length === 0) return;
  const r = a.prepare("INSERT OR IGNORE INTO MediaPeople (media_id, person_id) VALUES (?, ?)");
  t.forEach((n) => {
    const o = Xe(n);
    r.run(e, o);
  });
}
function Zt(e, t) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    a.prepare("BEGIN").run();
    const r = Kt(t.collection);
    return a.prepare(`
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
    ), Xt(e, t.tags || []), Qt(e, t.people || []), a.prepare("COMMIT").run(), Ge(e);
  } catch (r) {
    throw a == null || a.prepare("ROLLBACK").run(), console.error("Error updating media with relations:", r), r;
  }
}
function er() {
  const e = qe();
  return {
    totalMedia: e.totals.totalMemories,
    collectionsCount: e.totals.collections,
    peopleCount: e.totals.people,
    tagsCount: e.totals.tags,
    mediaTypeCounts: {
      image: e.totals.images,
      document: e.totals.documents,
      video: e.totals.videos,
      audio: e.totals.audio
    }
  };
}
function qe() {
  try {
    if (a || S(), !a)
      return {
        databaseConnected: !1,
        totals: {
          totalMemories: 0,
          images: 0,
          documents: 0,
          videos: 0,
          audio: 0,
          collections: 0,
          people: 0,
          tags: 0
        },
        mediaFiles: []
      };
    const e = a.prepare("SELECT COUNT(*) as count FROM Media").get().count || 0, t = a.prepare("SELECT COUNT(*) as count FROM Collections").get().count || 0, r = a.prepare("SELECT COUNT(*) as count FROM People").get().count || 0, n = a.prepare("SELECT COUNT(*) as count FROM Tags").get().count || 0, i = a.prepare(`
      SELECT LOWER(mt.name) as media_type, COUNT(m.id) as count
      FROM MediaTypes mt
      LEFT JOIN Media m ON m.media_type_id = mt.id
      GROUP BY mt.id, mt.name
    `).all().reduce((p, u) => (p[u.media_type] = u.count || 0, p), {}), l = a.prepare(`
      SELECT
        m.id,
        m.title,
        m.file_name,
        m.file_path,
        mt.name as media_type
      FROM Media m
      LEFT JOIN MediaTypes mt ON mt.id = m.media_type_id
      ORDER BY m.created_at DESC, m.id DESC
    `).all();
    return {
      databaseConnected: !0,
      totals: {
        totalMemories: e,
        images: i.image || 0,
        documents: i.document || 0,
        videos: i.video || 0,
        audio: i.audio || 0,
        collections: t,
        people: r,
        tags: n
      },
      mediaFiles: l
    };
  } catch (e) {
    return console.error("Error getting vault statistics:", e), {
      databaseConnected: !1,
      totals: {
        totalMemories: 0,
        images: 0,
        documents: 0,
        videos: 0,
        audio: 0,
        collections: 0,
        people: 0,
        tags: 0
      },
      mediaFiles: []
    };
  }
}
function ee(e) {
  const t = Z(e.thumbnail_path), r = Z(e.file_path);
  return {
    thumbnail_path: t || e.thumbnail_path || null,
    thumbnail_url: t ? Q(t).href : null,
    file_path: r || e.file_path || null,
    file_url: r ? Q(r).href : null,
    media_type: e.media_type || null
  };
}
function tr() {
  try {
    if (!a) return [];
    const e = se(), t = a.prepare(`
      SELECT
        c.id,
        c.name,
        c.description,
        COUNT(m.id) as media_count,
        MIN(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as start_year,
        MAX(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as end_year,
        cover.file_path,
        cover.thumbnail_path,
        cover_type.name as media_type,
        0 as is_system_grouping
      FROM Collections c
      LEFT JOIN Media m ON m.collection_id = c.id
      LEFT JOIN Media cover ON cover.id = (
        SELECT m2.id
        FROM Media m2
        LEFT JOIN MediaTypes mt2 ON mt2.id = m2.media_type_id
        WHERE m2.collection_id = c.id
        ORDER BY CASE WHEN LOWER(mt2.name) = 'image' THEN 0 ELSE 1 END, m2.thumbnail_path IS NULL, m2.created_at DESC
        LIMIT 1
      )
      LEFT JOIN MediaTypes cover_type ON cover_type.id = cover.media_type_id
      WHERE LOWER(TRIM(c.name)) NOT IN (${e})
      GROUP BY c.id
      ORDER BY c.name COLLATE NOCASE
    `).all(...F), r = a.prepare(`
      SELECT
        ? as id,
        ? as name,
        ? as description,
        COUNT(m.id) as media_count,
        MIN(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as start_year,
        MAX(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as end_year,
        cover.file_path,
        cover.thumbnail_path,
        cover_type.name as media_type,
        1 as is_system_grouping
      FROM Media m
      LEFT JOIN Collections c ON c.id = m.collection_id
      LEFT JOIN Media cover ON cover.id = (
        SELECT m2.id
        FROM Media m2
        LEFT JOIN Collections c2 ON c2.id = m2.collection_id
        LEFT JOIN MediaTypes mt2 ON mt2.id = m2.media_type_id
        WHERE m2.collection_id IS NULL OR LOWER(TRIM(c2.name)) IN (${e})
        ORDER BY CASE WHEN LOWER(mt2.name) = 'image' THEN 0 ELSE 1 END, m2.thumbnail_path IS NULL, m2.created_at DESC
        LIMIT 1
      )
      LEFT JOIN MediaTypes cover_type ON cover_type.id = cover.media_type_id
      WHERE m.collection_id IS NULL OR LOWER(TRIM(c.name)) IN (${e})
    `).get(
      ie,
      Ft,
      Ut,
      ...F,
      ...F
    ), n = t.map((o) => ({ ...o, ...ee(o) }));
    return r && r.media_count > 0 && n.push({ ...r, ...ee(r) }), n;
  } catch (e) {
    return console.error("Error getting collection summaries:", e), [];
  }
}
function rr(e) {
  return String(e) === ie ? k({ ungrouped: !0, sort: "uploaded", limit: 1e3, offset: 0 }) : k({ collectionIds: [Number(e)], sort: "uploaded", limit: 1e3, offset: 0 });
}
function ar() {
  try {
    return a ? a.prepare(`
      SELECT
        p.id,
        p.name,
        COUNT(DISTINCT m.id) as media_count,
        MIN(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as start_year,
        MAX(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as end_year,
        cover.file_path,
        cover.thumbnail_path,
        cover_type.name as media_type
      FROM People p
      LEFT JOIN MediaPeople mp ON mp.person_id = p.id
      LEFT JOIN Media m ON m.id = mp.media_id
      LEFT JOIN Media cover ON cover.id = (
        SELECT m2.id
        FROM MediaPeople mp2
        JOIN Media m2 ON m2.id = mp2.media_id
        LEFT JOIN MediaTypes mt2 ON mt2.id = m2.media_type_id
        WHERE mp2.person_id = p.id
        ORDER BY CASE WHEN LOWER(mt2.name) = 'image' THEN 0 ELSE 1 END, m2.thumbnail_path IS NULL, m2.created_at DESC
        LIMIT 1
      )
      LEFT JOIN MediaTypes cover_type ON cover_type.id = cover.media_type_id
      GROUP BY p.id
      HAVING media_count > 0
      ORDER BY p.name COLLATE NOCASE
    `).all().map((t) => ({ ...t, ...ee(t) })) : [];
  } catch (e) {
    return console.error("Error getting people summaries:", e), [];
  }
}
function nr(e) {
  return k({ personIds: [Number(e)], sort: "uploaded", limit: 1e3, offset: 0 });
}
function or() {
  try {
    return a ? a.prepare(`
      SELECT
        t.id,
        t.name,
        COUNT(DISTINCT mt.media_id) as media_count
      FROM Tags t
      LEFT JOIN MediaTags mt ON mt.tag_id = t.id
      GROUP BY t.id
      HAVING media_count > 0
      ORDER BY media_count DESC, t.name COLLATE NOCASE ASC
    `).all() : [];
  } catch (e) {
    return console.error("Error getting tag summaries:", e), [];
  }
}
function ir(e) {
  return k({ tagIds: [Number(e)], sort: "uploaded", limit: 1e3, offset: 0 });
}
function sr() {
  try {
    return a ? a.prepare(`
      SELECT
        strftime('%Y', m.capture_date) as year,
        COUNT(m.id) as media_count,
        MIN(m.capture_date) as start_date,
        MAX(m.capture_date) as end_date,
        cover.file_path,
        cover.thumbnail_path,
        cover_type.name as media_type
      FROM Media m
      LEFT JOIN Media cover ON cover.id = (
        SELECT m2.id
        FROM Media m2
        LEFT JOIN MediaTypes mt2 ON mt2.id = m2.media_type_id
        WHERE strftime('%Y', m2.capture_date) = strftime('%Y', m.capture_date)
          AND m2.capture_date IS NOT NULL
          AND m2.capture_date != ''
        ORDER BY CASE WHEN LOWER(mt2.name) = 'image' THEN 0 ELSE 1 END, m2.thumbnail_path IS NULL, m2.capture_date ASC
        LIMIT 1
      )
      LEFT JOIN MediaTypes cover_type ON cover_type.id = cover.media_type_id
      WHERE m.capture_date IS NOT NULL AND m.capture_date != ''
      GROUP BY year
      ORDER BY year DESC
    `).all().map((t) => ({ ...t, ...ee(t) })) : [];
  } catch (e) {
    return console.error("Error getting date summaries:", e), [];
  }
}
function cr(e) {
  return k({ dateFrom: `${e}-01-01`, dateTo: `${e}-12-31`, sort: "oldest", limit: 1e3, offset: 0 });
}
function lr(e, { name: t, description: r = "" }) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    if (String(e) === ie) throw new Error("Ungrouped Memories is a system grouping and cannot be edited");
    const n = String(t || "").trim();
    if (!n) throw new Error("Collection name is required");
    if (Te(n)) throw new Error("This name is reserved for ungrouped media");
    return a.prepare("UPDATE Collections SET name = ?, description = ? WHERE id = ?").run(n, r || "", Number(e)), a.prepare("SELECT * FROM Collections WHERE id = ?").get(Number(e));
  } catch (n) {
    throw console.error("Error updating collection details:", n), n;
  }
}
function dr(e) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    if (String(e) === ie)
      return { success: !1, blocked: !0, mediaCount: 0, error: "Ungrouped Memories is a system grouping and cannot be deleted" };
    const t = Number(e), r = a.prepare("SELECT COUNT(*) as count FROM Media WHERE collection_id = ?").get(t).count;
    return r > 0 ? { success: !1, blocked: !0, mediaCount: r } : { success: a.prepare("DELETE FROM Collections WHERE id = ?").run(t).changes > 0, blocked: !1, mediaCount: 0 };
  } catch (t) {
    throw console.error("Error deleting collection:", t), t;
  }
}
function ur() {
  try {
    return a ? a.prepare("SELECT * FROM MediaTypes ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting media types:", e), [];
  }
}
function mr() {
  try {
    return a ? a.prepare("SELECT * FROM SourceTypes ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting source types:", e), [];
  }
}
function pr() {
  try {
    return a ? a.prepare(`
      SELECT * FROM Collections
      WHERE LOWER(TRIM(name)) NOT IN (${se()})
      ORDER BY name
    `).all(...F) : [];
  } catch (e) {
    return console.error("Error getting collections:", e), [];
  }
}
function Er() {
  try {
    return a ? a.prepare("SELECT * FROM Tags ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting tags:", e), [];
  }
}
function hr() {
  try {
    return a ? a.prepare("SELECT * FROM People ORDER BY name").all() : [];
  } catch (e) {
    return console.error("Error getting people:", e), [];
  }
}
function Ke(e) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    const t = a.prepare("SELECT id FROM Tags WHERE name = ?").get(e);
    return t ? t.id : a.prepare("INSERT INTO Tags (name) VALUES (?)").run(e).lastInsertRowid;
  } catch (t) {
    throw console.error("Error adding tag:", t), t;
  }
}
function Xe(e) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    const t = a.prepare("SELECT id FROM People WHERE name = ?").get(e);
    return t ? t.id : a.prepare("INSERT INTO People (name) VALUES (?)").run(e).lastInsertRowid;
  } catch (t) {
    throw console.error("Error adding person:", t), t;
  }
}
function fr(e, t) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    return a.prepare("INSERT OR IGNORE INTO MediaTags (media_id, tag_id) VALUES (?, ?)").run(e, t), !0;
  } catch (r) {
    throw console.error("Error linking tag to media:", r), r;
  }
}
function gr(e, t) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    return a.prepare("INSERT OR IGNORE INTO MediaPeople (media_id, person_id) VALUES (?, ?)").run(e, t), !0;
  } catch (r) {
    throw console.error("Error linking person to media:", r), r;
  }
}
function Qe(e, t = "") {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    if (Te(e)) return null;
    const r = a.prepare("SELECT id FROM Collections WHERE name = ?").get(e);
    return r ? r.id : a.prepare("INSERT INTO Collections (name, description) VALUES (?, ?)").run(e, t).lastInsertRowid;
  } catch (r) {
    throw console.error("Error adding collection:", r), r;
  }
}
function yr(e) {
  try {
    if (a || S(), !a) throw new Error("Database not initialized");
    a.prepare("BEGIN TRANSACTION").run();
    try {
      a.prepare("DELETE FROM MediaTags WHERE media_id = ?").run(e), a.prepare("DELETE FROM MediaPeople WHERE media_id = ?").run(e), a.prepare("DELETE FROM Comments WHERE media_id = ?").run(e);
      const r = a.prepare("DELETE FROM Media WHERE id = ?").run(e);
      return a.prepare("COMMIT").run(), r.changes > 0;
    } catch (t) {
      throw a.prepare("ROLLBACK").run(), t;
    }
  } catch (t) {
    throw console.error("Error deleting media:", t), t;
  }
}
var _r = {
  initializeDatabase: S,
  resetDatabaseConnection: $t,
  getAllMedia: Jt,
  addMedia: Yt,
  searchMedia: k,
  getMediaDetails: Ge,
  getMemoryNotes: Ye,
  addMemoryNote: qt,
  getDashboardSummary: er,
  getVaultStatistics: qe,
  getCollectionSummaries: tr,
  getCollectionMedia: rr,
  getPeopleSummaries: ar,
  getPersonMedia: nr,
  getTagSummaries: or,
  getTagMedia: ir,
  getDateSummaries: sr,
  getDateMedia: cr,
  updateCollectionDetails: lr,
  deleteCollectionIfEmpty: dr,
  getMediaTypes: ur,
  getSourceTypes: mr,
  getCollections: pr,
  getTags: Er,
  getPeople: hr,
  addTag: Ke,
  addPerson: Xe,
  linkTagToMedia: fr,
  linkPersonToMedia: gr,
  addCollection: Qe,
  updateMediaWithRelations: Zt,
  deleteMedia: yr
};
const c = /* @__PURE__ */ We(_r), {
  ensureStorageRoot: ua,
  ensureArchiveDirectory: Nr,
  ARCHIVE_FOLDER_NAME: Tr
} = Ne;
async function Lr() {
  try {
    return { mediaDir: Nr() };
  } catch (e) {
    throw console.error("Error creating directories:", e), e;
  }
}
function Sr(e) {
  const t = Date.now(), r = Math.random().toString(36).substring(2, 8), n = s.extname(e);
  return `${s.basename(e, n)}_${t}_${r}${n}`;
}
async function Or(e, t) {
  try {
    const { mediaDir: r } = await Lr(), n = Sr(t), o = s.join(r, n);
    return await E.copyFile(e, o), {
      filePath: o,
      fileName: n,
      relativePath: s.join(Tr, n)
    };
  } catch (r) {
    throw console.error("Error saving media file:", r), r;
  }
}
async function Rr(e, t) {
  try {
    return {
      ...await Or(e, t),
      thumbnail: null
      // No thumbnail
    };
  } catch (r) {
    throw console.error("Error processing media file:", r), r;
  }
}
const { readSettings: Cr, writeSettings: Mr } = Ne, B = {
  getState: "updates:get-state",
  check: "updates:check",
  download: "updates:download",
  quitAndInstall: "updates:quit-and-install",
  stateChanged: "updates:state-changed"
}, Ze = 7 * 24 * 60 * 60 * 1e3, wr = 12e3;
let m, Re = !1, Ce = !1, $ = null, V = null, et = !1, Me = null, j = null;
function tt() {
  return !!(process.env.PORTABLE_EXECUTABLE_FILE || process.env.PORTABLE_EXECUTABLE_DIR || process.env.PORTABLE_EXECUTABLE_APP_FILENAME);
}
function J() {
  return N.isPackaged && process.platform === "win32" && !tt();
}
function rt() {
  return Cr();
}
function Le(e) {
  if (!e) return;
  const t = Date.parse(e);
  if (Number.isFinite(t))
    return new Date(t + Ze).toISOString();
}
function at() {
  const e = rt(), t = J();
  return {
    status: t ? "idle" : "unsupported",
    supported: t,
    currentVersion: N.getVersion(),
    lastCheckedAt: e.lastUpdateCheckAt,
    nextAutomaticCheckAt: Le(e.lastUpdateCheckAt),
    error: t ? void 0 : nt()
  };
}
function nt() {
  return N.isPackaged ? process.platform !== "win32" ? "Automatic updates are available only for installed Windows builds." : tt() ? "Portable builds should be updated manually by downloading the latest portable package." : "Automatic updates are not supported in this build." : "Real update checks are available only in an installed Windows build.";
}
function x(e) {
  const t = e instanceof Error ? e.message : String(e || "Unknown update error.");
  return /token|authorization|password|secret|bearer/i.test(t) ? "Memory Vault could not check for updates. Please try again later." : t.replace(/https?:\/\/[^\s)]+/g, "the update server").slice(0, 240);
}
function we(e) {
  return {
    availableVersion: e.version,
    releaseName: e.releaseName ?? null,
    releaseDate: e.releaseDate
  };
}
function C(e) {
  return m = { ...m, ...e, currentVersion: N.getVersion(), supported: J() }, m.lastCheckedAt && (m.nextAutomaticCheckAt = Le(m.lastCheckedAt)), re.getAllWindows().forEach((t) => t.webContents.send(B.stateChanged, m)), m;
}
function Ir() {
  const e = (/* @__PURE__ */ new Date()).toISOString(), t = rt();
  Mr({ ...t, lastUpdateCheckAt: e }), C({ lastCheckedAt: e, nextAutomaticCheckAt: Le(e) });
}
function br() {
  O.autoDownload = !1, O.autoInstallOnAppQuit = !1, O.allowPrerelease = !1, O.allowDowngrade = !1;
}
function vr() {
  Re || !J() || (Re = !0, O.on("checking-for-update", () => C({ status: "checking", error: void 0, progress: void 0 })), O.on("update-available", (e) => C({ status: "available", ...we(e), error: void 0, progress: void 0 })), O.on("update-not-available", () => C({ status: "up-to-date", error: void 0, progress: void 0 })), O.on("download-progress", (e) => C({
    status: "downloading",
    progress: {
      percent: Math.max(0, Math.min(100, e.percent || 0)),
      transferred: e.transferred || 0,
      total: e.total || 0,
      bytesPerSecond: e.bytesPerSecond || 0
    },
    error: void 0
  })), O.on("update-downloaded", (e) => {
    et = !0, C({ status: "downloaded", ...we(e), progress: void 0, error: void 0 });
  }), O.on("error", (e) => {
    console.warn("Update service error:", x(e)), C({ status: "error", error: x(e), progress: void 0 });
  }));
}
function Se() {
  return J() ? null : C({ status: "unsupported", error: nt() });
}
function G(e) {
  var r;
  const t = ((r = e.senderFrame) == null ? void 0 : r.url) || e.sender.getURL();
  if (!t) throw new Error("Updater request rejected: unknown sender.");
  if (!N.isPackaged) {
    const n = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";
    if (new URL(t).origin !== new URL(n).origin) throw new Error("Updater request rejected: unexpected development origin.");
    return;
  }
  if (new URL(t).protocol !== "file:") throw new Error("Updater request rejected: unexpected packaged renderer URL.");
}
async function ot(e) {
  const t = Se();
  return t || $ || (!e && m.lastCheckedAt && Date.now() < Date.parse(m.lastCheckedAt) + Ze ? m : (Ir(), $ = O.checkForUpdates().then(() => m).catch((r) => C({ status: "error", error: x(r), progress: void 0 })).finally(() => {
    $ = null;
  }), $));
}
async function Ar() {
  const e = Se();
  return e || V || (m.status !== "available" ? C({ error: "No downloaded update is available to install yet." }) : (V = O.downloadUpdate().then(() => m).catch((t) => C({ status: "error", error: x(t), progress: void 0 })).finally(() => {
    V = null;
  }), C({ status: "downloading", progress: { percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 }, error: void 0 }), V));
}
function Dr() {
  const e = Se();
  return e ? { success: !1, error: e.error } : !et || m.status !== "downloaded" ? { success: !1, error: "The update has not finished downloading yet." } : (O.quitAndInstall(!1, !0), { success: !0 });
}
function Pr() {
  return m || (m = at()), m;
}
function Fr(e) {
  j = e.getMainWindow(), m = at(), br(), vr(), Ce || (Ce = !0, d.handle(B.getState, (t) => (G(t), Pr())), d.handle(B.check, (t) => (G(t), ot(!0))), d.handle(B.download, (t) => (G(t), Ar())), d.handle(B.quitAndInstall, (t) => (G(t), Dr())));
}
function Ur() {
  !J() || Me || (Me = setTimeout(() => {
    j = j && !j.isDestroyed() ? j : re.getAllWindows()[0] || null, ot(!1).catch((e) => console.warn("Automatic update check failed:", x(e)));
  }, wr));
}
const {
  LIBRARY_FOLDER_NAME: pe,
  ARCHIVE_FOLDER_NAME: Ee,
  DATABASE_FILENAME: Ie,
  SETTINGS_FILENAME: Wr,
  getSettingsPath: kr,
  looksLikeLibrary: te,
  isAdoptableLegacyLibrary: Hr,
  getActiveLibraryPath: be,
  setActiveLibraryPath: $r,
  resolveArchiveFilePath: Oe,
  resolveStorageRoot: Vr
} = Ne, Br = import.meta.url, it = s.dirname(Fe(Br));
process.env.APP_ROOT = s.join(it, "..");
const X = process.env.VITE_DEV_SERVER_URL, ma = s.join(process.env.APP_ROOT, "dist-electron"), st = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = X ? s.join(process.env.APP_ROOT, "public") : st;
const ct = s.join(process.env.VITE_PUBLIC, "memory-vault-logo.png"), jr = process.env.MEMORY_VAULT_DEBUG === "1", zr = process.env.MEMORY_VAULT_OPEN_DEVTOOLS === "1";
function U(...e) {
  jr && console.log(...e);
}
function xr(e) {
  return e ? e.startsWith("file://") ? Fe(e) : /^(data|blob|https?):/i.test(e) ? null : Oe(e) || e : null;
}
function Jr(e) {
  const t = s.extname(e).toLowerCase().substring(1);
  return ["jpg", "jpeg"].includes(t) ? "image/jpeg" : t === "png" ? "image/png" : t === "gif" ? "image/gif" : t === "webp" ? "image/webp" : t === "pdf" ? "application/pdf" : t === "mp4" ? "video/mp4" : t === "mp3" ? "audio/mpeg" : t === "wav" ? "audio/wav" : "application/octet-stream";
}
const lt = /* @__PURE__ */ new Set();
async function P(e) {
  try {
    return await E.access(e), !0;
  } catch {
    return !1;
  }
}
async function Y(e) {
  try {
    const t = await E.stat(e);
    return t.isFile() ? t.size : 0;
  } catch {
    return 0;
  }
}
async function dt(e) {
  let t = 0;
  async function r(n) {
    let o;
    try {
      o = await E.readdir(n, { withFileTypes: !0 });
    } catch {
      return;
    }
    await Promise.all(o.map(async (i) => {
      const l = s.join(n, i.name);
      i.isDirectory() ? await r(l) : i.isFile() && (t += await Y(l));
    }));
  }
  return await r(e), t;
}
async function Yr(e, t) {
  const r = [];
  async function n(o) {
    let i;
    try {
      i = await E.readdir(o, { withFileTypes: !0 });
    } catch {
      return;
    }
    for (const l of i) {
      const p = s.join(o, l.name);
      if (l.isDirectory())
        await n(p);
      else if (l.isFile()) {
        const u = s.relative(t, p).replace(/\\/g, "/");
        r.push({
          absolutePath: p,
          relativePath: u,
          size: await Y(p)
        });
      }
    }
  }
  return await n(e), r;
}
async function Gr(e) {
  try {
    const t = await E.statfs(e), r = Number(t.bavail) * Number(t.bsize), n = Number(t.blocks) * Number(t.bsize), o = Math.max(n - r, 0), i = n > 0 ? o / n * 100 : null;
    return { freeBytes: r, totalBytes: n, usedBytes: o, usedPercent: i };
  } catch (t) {
    return console.warn("Disk statistics unavailable:", t), { freeBytes: null, totalBytes: null, usedBytes: null, usedPercent: null };
  }
}
function I() {
  const e = Vr(), t = s.join(e, Ee), r = s.join(e, Ie);
  return {
    vaultRoot: e,
    libraryPath: e,
    settingsPath: kr(),
    settingsFileName: Wr,
    databasePath: r,
    databaseFileName: Ie,
    archivePath: t,
    archiveFolderName: Ee
  };
}
async function he(e) {
  var t, r;
  return await E.mkdir(e, { recursive: !0 }), await E.mkdir(s.join(e, Ee), { recursive: !0 }), $r(e), (t = c.resetDatabaseConnection) == null || t.call(c), (r = c.initializeDatabase) == null || r.call(c), I();
}
async function qr(e) {
  if (!e) return { valid: !1, error: "Please choose a Memory Vault Library folder." };
  if (te(e)) return { valid: !0, libraryPath: e };
  const t = s.join(e, pe);
  return te(t) ? { valid: !0, libraryPath: t } : {
    valid: !1,
    error: "This does not look like a Memory Vault Library. Please choose a folder that contains memoryvault.db and Memory Vault Archive."
  };
}
async function Kr() {
  const { canceled: e, filePaths: t } = await z.showOpenDialog({
    title: "Choose where to keep your memories",
    properties: ["openDirectory", "createDirectory"]
  });
  if (e || t.length === 0) return { success: !1, canceled: !0 };
  const r = t[0], n = s.join(r, pe);
  let o = n;
  if (await P(n)) {
    if (te(n))
      return { success: !0, paths: await he(n) };
    o = await mt(r, pe);
  }
  return { success: !0, paths: await he(o) };
}
async function Xr() {
  const { canceled: e, filePaths: t } = await z.showOpenDialog({
    title: "Open an Existing Memory Vault Library",
    properties: ["openDirectory"]
  });
  if (e || t.length === 0) return { success: !1, canceled: !0 };
  const r = await qr(t[0]);
  return !r.valid || !r.libraryPath ? { success: !1, error: r.error } : { success: !0, paths: await he(r.libraryPath) };
}
function ut() {
  var r, n;
  const e = be({ adoptLegacy: !1 });
  if (e) {
    if (!te(e))
      return { configured: !1, activeLibraryPath: null, paths: null };
    try {
      (r = c.initializeDatabase) == null || r.call(c);
    } catch (o) {
      return console.error("Unable to initialize active Memory Vault Library:", o), { configured: !1, activeLibraryPath: null, paths: null };
    }
    return { configured: !0, activeLibraryPath: e, paths: I() };
  }
  const t = be({ adoptLegacy: !0 });
  if (!t || !Hr(t))
    return { configured: !1, activeLibraryPath: null, paths: null };
  try {
    (n = c.initializeDatabase) == null || n.call(c);
  } catch (o) {
    return console.error("Unable to initialize legacy Memory Vault Library:", o), { configured: !1, activeLibraryPath: null, paths: null };
  }
  return { configured: !0, activeLibraryPath: t, paths: I() };
}
function Qr(e = /* @__PURE__ */ new Date()) {
  const t = (r) => String(r).padStart(2, "0");
  return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}`;
}
async function mt(e, t) {
  let r = s.join(e, t), n = 2;
  for (; await P(r); )
    r = s.join(e, `${t}-${n}`), n += 1;
  return r;
}
async function pt(e, t, r) {
  await E.mkdir(s.dirname(t), { recursive: !0 }), await E.copyFile(e, t), r.copiedFileCount += 1, r.totalBytesCopied += await Y(e);
}
async function Et(e, t, r) {
  await E.mkdir(t, { recursive: !0 });
  const n = await E.readdir(e, { withFileTypes: !0 });
  for (const o of n) {
    const i = s.join(e, o.name), l = s.join(t, o.name);
    o.isDirectory() ? await Et(i, l, r) : o.isFile() && await pt(i, l, r);
  }
}
async function ve(e, t, r) {
  await E.writeFile(e, t, "utf8"), r.copiedFileCount += 1, r.totalBytesCopied += new TextEncoder().encode(t).length;
}
function Zr() {
  return `Memory Vault Shareable Copy

This folder contains Memory Vault library data. To open it, install Memory Vault and choose Open an Existing Library.

What's included:
- memoryvault.db
- Memory Vault Archive/
- copy-info.json

Keep this folder together so Memory Vault can recognize it as an existing Memory Vault Library.
`;
}
async function Ae(e) {
  var g, w, D;
  const { canceled: t, filePaths: r } = await z.showOpenDialog({
    title: e === "backup" ? "Choose backup destination" : "Choose shareable copy destination",
    properties: ["openDirectory", "createDirectory"]
  });
  if (t || r.length === 0)
    return { success: !1, canceled: !0 };
  const n = r[0], o = I(), [i, l] = await Promise.all([
    P(o.databasePath),
    P(o.archivePath)
  ]);
  if (!i)
    return { success: !1, error: "The vault database file could not be found, so the copy was not created." };
  if (!l)
    return { success: !1, error: "The media archive folder could not be found, so the copy was not created." };
  const u = await mt(n, `${e === "backup" ? "MemoryVault-Backup" : "MemoryVault-Shareable-Copy"}-${Qr()}`), R = { copiedFileCount: 0, totalBytesCopied: 0 }, v = await c.getVaultStatistics(), W = await Y(o.databasePath), A = await dt(o.archivePath);
  await E.mkdir(u, { recursive: !1 }), await pt(o.databasePath, s.join(u, o.databaseFileName), R), await Et(o.archivePath, s.join(u, o.archiveFolderName), R);
  const H = {
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    backupType: e === "backup" ? "backup" : "shareable-copy",
    sourceVaultPath: o.vaultRoot,
    databaseFileName: o.databaseFileName,
    databaseSizeBytes: W,
    archiveFolderName: o.archiveFolderName,
    archiveSizeBytes: A,
    mediaCount: ((g = v == null ? void 0 : v.totals) == null ? void 0 : g.totalMemories) ?? null,
    appVersion: ((D = (w = N).getVersion) == null ? void 0 : D.call(w)) || null
  }, f = e === "backup" ? "backup-info.json" : "copy-info.json";
  return await ve(s.join(u, f), `${JSON.stringify(H, null, 2)}
`, R), e === "shareable-copy" && await ve(s.join(u, "README-Start-Here.txt"), Zr(), R), lt.add(s.normalize(u)), {
    success: !0,
    destinationPath: u,
    copiedFileCount: R.copiedFileCount,
    totalBytesCopied: R.totalBytesCopied
  };
}
async function ea() {
  const e = I(), [t, r, n] = await Promise.all([
    P(e.vaultRoot),
    P(e.databasePath),
    P(e.archivePath)
  ]), o = [];
  t || o.push("Vault folder is missing or cannot be accessed."), r || o.push("Database file is missing."), n || o.push("Media archive folder is missing.");
  const i = await c.getVaultStatistics();
  i.databaseConnected || o.push("Database connection is unavailable.");
  const l = n ? await Yr(e.archivePath, e.vaultRoot) : [], p = /* @__PURE__ */ new Set(), u = [];
  await Promise.all((i.mediaFiles || []).map(async (f) => {
    const g = String(f.file_path || "");
    if (!g) return;
    const w = Oe(g), D = s.isAbsolute(g) ? s.relative(e.vaultRoot, g).replace(/\\/g, "/") : g.replace(/\\/g, "/");
    p.add(D), (!w || !await P(w)) && u.push({
      id: f.id,
      title: f.title,
      fileName: f.file_name || s.basename(g),
      filePath: g,
      mediaType: f.media_type
    });
  }));
  const R = l.filter((f) => !p.has(f.relativePath)).map((f) => ({
    fileName: s.basename(f.absolutePath),
    filePath: f.relativePath,
    size: f.size
  })), [v, W, A] = await Promise.all([
    Y(e.databasePath),
    n ? dt(e.archivePath) : Promise.resolve(0),
    Gr(e.vaultRoot)
  ]), H = o.length === 0 && u.length === 0 ? "healthy" : "needs_attention";
  return {
    paths: e,
    health: {
      status: H,
      vaultRoot: t ? "healthy" : "missing",
      databaseFile: r ? "healthy" : "missing",
      archiveFolder: n ? "healthy" : "missing",
      databaseConnection: i.databaseConnected ? "healthy" : "unknown",
      warnings: o
    },
    storage: {
      archiveSizeBytes: W,
      databaseSizeBytes: v,
      diskFreeBytes: A.freeBytes,
      diskTotalBytes: A.totalBytes,
      diskUsedBytes: A.usedBytes,
      diskUsedPercent: A.usedPercent
    },
    totals: i.totals,
    integrity: {
      missingFilesCount: u.length,
      orphanFilesCount: R.length,
      missingFiles: u.slice(0, 20),
      orphanFiles: R.slice(0, 20)
    }
  };
}
function ta() {
  d.handle("get-library-status", async () => ut()), d.handle("choose-create-new-library", async () => {
    try {
      return await Kr();
    } catch (e) {
      return console.error("Error creating Memory Vault Library:", e), { success: !1, error: e instanceof Error ? e.message : "Unable to create Memory Vault Library." };
    }
  }), d.handle("choose-open-existing-library", async () => {
    try {
      return await Xr();
    } catch (e) {
      return console.error("Error opening Memory Vault Library:", e), { success: !1, error: e instanceof Error ? e.message : "Unable to open Memory Vault Library." };
    }
  }), d.handle("get-library-paths", async () => I()), d.handle("get-vault-settings", async () => {
    try {
      return I();
    } catch (e) {
      return console.error("Error getting vault settings:", e), { error: e instanceof Error ? e.message : "Unknown error" };
    }
  }), d.handle("open-vault-folder", async () => {
    try {
      const e = await ue.openPath(I().vaultRoot);
      return { success: e.length === 0, error: e || void 0 };
    } catch (e) {
      return console.error("Error opening vault folder:", e), { success: !1, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }), d.handle("open-archive-folder", async () => {
    try {
      const e = await ue.openPath(I().archivePath);
      return { success: e.length === 0, error: e || void 0 };
    } catch (e) {
      return console.error("Error opening archive folder:", e), { success: !1, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }), d.handle("get-vault-health", async () => {
    try {
      return await ea();
    } catch (e) {
      return console.error("Error getting vault health:", e), { error: e instanceof Error ? e.message : "Unknown error" };
    }
  }), d.handle("create-vault-backup", async () => {
    try {
      return await Ae("backup");
    } catch (e) {
      return console.error("Error creating vault backup:", e), { success: !1, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }), d.handle("create-vault-shareable-copy", async () => {
    try {
      return await Ae("shareable-copy");
    } catch (e) {
      return console.error("Error creating vault shareable copy:", e), { success: !1, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }), d.handle("open-vault-output-folder", async (e, t) => {
    try {
      const r = s.normalize(t || "");
      if (!lt.has(r))
        return { success: !1, error: "This folder was not created during the current Memory Vault session." };
      const n = await ue.openPath(r);
      return { success: n.length === 0, error: n || void 0 };
    } catch (r) {
      return console.error("Error opening vault output folder:", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), d.handle("select-files", async () => {
    U("Showing file dialog...");
    const { canceled: e, filePaths: t } = await z.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Media Files", extensions: ["jpg", "jpeg", "png", "gif", "mp4", "pdf", "doc", "docx"] }
      ]
    });
    return e ? [] : Promise.all(t.map(async (r) => {
      const n = await E.stat(r);
      return {
        path: r,
        name: s.basename(r),
        size: n.size,
        type: s.extname(r).toLowerCase(),
        lastModified: n.mtime.getTime()
      };
    }));
  }), d.handle("get-file-preview", async (e, t) => {
    try {
      const r = xr(t);
      if (!r)
        return null;
      U("Generating preview for:", r);
      const o = (await E.readFile(r)).toString("base64"), i = Jr(r);
      return U("Preview generated with mime type:", i), {
        dataUrl: `data:${i};base64,${o}`,
        mimeType: i
      };
    } catch (r) {
      return console.error("Error reading file:", r), null;
    }
  }), d.handle("get-media-types", async () => {
    try {
      const e = await c.getMediaTypes();
      return U("Media types from database:", e), e.length > 0 ? e : [
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
  }), d.handle("get-collections", async () => {
    try {
      return await c.getCollections();
    } catch (e) {
      return console.error("Error getting collections:", e), [
        { id: 1, name: "Family Vacation 2023" },
        { id: 2, name: "Wedding Anniversary" },
        { id: 3, name: "Birthday Party" }
      ];
    }
  }), d.handle("get-tags", async () => {
    try {
      return await c.getTags();
    } catch (e) {
      return console.error("Error getting tags:", e), [
        { id: 1, name: "family" },
        { id: 2, name: "vacation" },
        { id: 3, name: "birthday" }
      ];
    }
  }), d.handle("get-people", async () => {
    try {
      return await c.getPeople();
    } catch (e) {
      return console.error("Error getting people:", e), [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Jane Smith" },
        { id: 3, name: "Alex Johnson" }
      ];
    }
  }), d.handle("search-media", async (e, t) => {
    try {
      return await c.searchMedia(t);
    } catch (r) {
      return console.error("Error searching media:", r), [];
    }
  }), d.handle("get-media-details", async (e, t) => {
    try {
      return await c.getMediaDetails(t);
    } catch (r) {
      return console.error("Error fetching media details:", r), null;
    }
  }), d.handle("get-dashboard-summary", async () => {
    try {
      return await c.getDashboardSummary();
    } catch (e) {
      return console.error("Error getting dashboard summary:", e), {
        totalMedia: 0,
        collectionsCount: 0,
        peopleCount: 0,
        tagsCount: 0,
        mediaTypeCounts: {}
      };
    }
  }), d.handle("get-collection-summaries", async () => {
    try {
      return await c.getCollectionSummaries();
    } catch (e) {
      return console.error("Error getting collection summaries:", e), [];
    }
  }), d.handle("get-collection-media", async (e, t) => {
    try {
      return await c.getCollectionMedia(t);
    } catch (r) {
      return console.error("Error getting collection media:", r), [];
    }
  }), d.handle("get-people-summaries", async () => {
    try {
      return await c.getPeopleSummaries();
    } catch (e) {
      return console.error("Error getting people summaries:", e), [];
    }
  }), d.handle("get-person-media", async (e, t) => {
    try {
      return await c.getPersonMedia(t);
    } catch (r) {
      return console.error("Error getting person media:", r), [];
    }
  }), d.handle("get-tag-summaries", async () => {
    try {
      return await c.getTagSummaries();
    } catch (e) {
      return console.error("Error getting tag summaries:", e), [];
    }
  }), d.handle("get-tag-media", async (e, t) => {
    try {
      return await c.getTagMedia(t);
    } catch (r) {
      return console.error("Error getting tag media:", r), [];
    }
  }), d.handle("get-date-summaries", async () => {
    try {
      return await c.getDateSummaries();
    } catch (e) {
      return console.error("Error getting date summaries:", e), [];
    }
  }), d.handle("get-date-media", async (e, t) => {
    try {
      return await c.getDateMedia(t);
    } catch (r) {
      return console.error("Error getting date media:", r), [];
    }
  }), d.handle("update-collection-details", async (e, t) => {
    try {
      return { success: !0, collection: await c.updateCollectionDetails(t.id, {
        name: t.name,
        description: t.description || ""
      }) };
    } catch (r) {
      return console.error("Error updating collection details:", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), d.handle("delete-collection", async (e, t) => {
    try {
      return await c.deleteCollectionIfEmpty(t);
    } catch (r) {
      return console.error("Error deleting collection:", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), d.handle("delete-media", async (e, t) => {
    try {
      return { success: await c.deleteMedia(t) };
    } catch (r) {
      return console.error("Error deleting media:", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), d.handle("get-memory-notes", async (e, t) => {
    try {
      return await c.getMemoryNotes(t);
    } catch (r) {
      return console.error("Error getting memory notes:", r), [];
    }
  }), d.handle("add-memory-note", async (e, t, r) => {
    try {
      return { success: !0, note: await c.addMemoryNote(t, r) };
    } catch (n) {
      return console.error("Error adding memory note:", n), { success: !1, error: n instanceof Error ? n.message : "Unknown error" };
    }
  }), d.handle("update-media-details", async (e, t) => {
    try {
      return { success: !0, media: await c.updateMediaWithRelations(t.id, {
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
  }), d.handle("download-media-file", async (e, t) => {
    try {
      const r = Oe(t.filePath);
      if (!r)
        throw new Error("File path was not provided.");
      const n = t.defaultFileName || s.basename(r), { canceled: o, filePath: i } = await z.showSaveDialog({
        defaultPath: n,
        title: "Save media as"
      });
      return o || !i ? { success: !1, canceled: !0 } : (await E.copyFile(r, i), { success: !0 });
    } catch (r) {
      return console.error("Error downloading media file:", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), d.handle("save-media", async (e, t) => {
    try {
      U("Saving media:", t);
      const r = await Rr(t.filePath, s.basename(t.filePath)), n = {
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
        const i = t.metadata.collection, l = i.id < 0 ? await c.addCollection(i.name, i.description || "") : i.id;
        n.collection_id = l;
      } else t.metadata.collectionId && (n.collection_id = parseInt(t.metadata.collectionId));
      const o = await c.addMedia(n);
      if (U(`Media saved with ID: ${o}`), t.metadata.tags && t.metadata.tags.length > 0)
        for (const i of t.metadata.tags) {
          const l = i.id < 0 ? await c.addTag(i.name) : i.id;
          await c.linkTagToMedia(o, l);
        }
      if (t.metadata.people && t.metadata.people.length > 0)
        for (const i of t.metadata.people) {
          if (!(i != null && i.name)) continue;
          const l = typeof i.id != "number" || i.id < 0 ? await c.addPerson(i.name) : Number(i.id);
          await c.linkPersonToMedia(o, l);
        }
      return { success: !0, mediaId: o };
    } catch (r) {
      return console.error("Error saving media:", r), {
        success: !1,
        error: r instanceof Error ? r.message : "Unknown error occurred"
      };
    }
  });
}
let M;
function ht() {
  M = new re({
    icon: ct,
    webPreferences: {
      preload: s.join(it, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    width: 1200,
    height: 800
  }), X && zr && M.webContents.openDevTools({ mode: "detach" }), M.webContents.on("did-finish-load", () => {
    M == null || M.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString()), Ur();
  }), X ? M.loadURL(X) : M.loadFile(s.join(st, "index.html"));
}
N.on("window-all-closed", () => {
  process.platform !== "darwin" && (N.quit(), M = null);
});
N.on("activate", () => {
  re.getAllWindows().length === 0 && ht();
});
N.whenReady().then(async () => {
  try {
    N.setName("Memory Vault"), N.setAppUserModelId("com.memoryvault.app"), process.platform === "darwin" && N.dock && N.dock.setIcon(ct), ut(), ta(), Fr({ getMainWindow: () => M }), ht(), U("App initialized successfully");
  } catch (e) {
    console.error("Error during app initialization:", e);
  }
});
export {
  ma as MAIN_DIST,
  st as RENDERER_DIST,
  X as VITE_DEV_SERVER_URL
};
//# sourceMappingURL=main.js.map
