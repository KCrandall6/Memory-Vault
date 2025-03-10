import { app as c, BrowserWindow as u, ipcMain as y } from "electron";
import { fileURLToPath as E } from "node:url";
import o from "node:path";
import { createRequire as S } from "node:module";
const m = S(import.meta.url), _ = m("better-sqlite3"), i = m("fs"), f = o.dirname(E(import.meta.url));
process.env.APP_ROOT = o.join(f, "..");
const p = process.env.VITE_DEV_SERVER_URL, P = o.join(process.env.APP_ROOT, "dist-electron"), T = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = p ? o.join(process.env.APP_ROOT, "public") : T;
let t, l = null;
function h() {
  console.log("Initializing database...");
  const e = o.resolve(process.cwd(), "..", "Database", "memory-vault.db");
  console.log(`Database path: ${e}`);
  const n = o.dirname(e);
  i.existsSync(n) || (i.mkdirSync(n, { recursive: !0 }), console.log(`Created database directory: ${n}`));
  try {
    const s = new _(e);
    console.log("Database connection established"), s.pragma("foreign_keys = ON");
    const r = o.resolve(process.cwd(), "resources", "create-database.sql");
    if (console.log(`SQL file path: ${r}`), !i.existsSync(r))
      return console.error("SQL file does not exist at path:", r), null;
    const a = i.readFileSync(r, "utf8");
    return console.log("SQL file read successfully"), s.exec(a), console.log("SQL commands executed"), I(s), console.log("Database initialized successfully"), s;
  } catch (s) {
    return console.error("Error initializing database:", s), null;
  }
}
function I(e) {
  if (e)
    try {
      if (e.prepare("SELECT COUNT(*) as count FROM MediaTypes").get().count === 0) {
        const r = ["Image", "Video", "Document", "Audio"], a = e.prepare("INSERT INTO MediaTypes (name) VALUES (?)");
        r.forEach((d) => {
          a.run(d);
        });
      }
      if (e.prepare("SELECT COUNT(*) as count FROM SourceTypes").get().count === 0) {
        const r = ["Digital Camera", "Phone", "Scanned Photo", "Scanned Document", "Slide", "Negative"], a = e.prepare("INSERT INTO SourceTypes (name) VALUES (?)");
        r.forEach((d) => {
          a.run(d);
        });
      }
      console.log("Default data inserted successfully");
    } catch (n) {
      console.error("Error inserting default data:", n);
    }
}
function R(e) {
  if (!e)
    return console.error("Database not initialized"), [];
  try {
    return e.prepare(`
      SELECT m.*, mt.name as media_type, st.name as source_type, c.name as collection_name
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      ORDER BY m.created_at DESC
    `).all();
  } catch (n) {
    return console.error("Error getting all media:", n), [];
  }
}
function g() {
  t = new u({
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: o.join(f, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), t.webContents.openDevTools(), t.webContents.on("did-finish-load", () => {
    t == null || t.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), p ? t.loadURL(p) : t.loadFile(o.join(T, "index.html"));
}
function D() {
  try {
    console.log("Setting up IPC handlers..."), y.handle("get-all-media", () => (console.log("IPC: Getting all media"), R(l)));
  } catch (e) {
    console.error("Error setting up IPC handlers:", e);
  }
}
c.on("window-all-closed", () => {
  process.platform !== "darwin" && (l && l.close(), c.quit(), t = null);
});
c.on("activate", () => {
  u.getAllWindows().length === 0 && g();
});
c.whenReady().then(() => {
  try {
    console.log("App is ready, initializing database..."), l = h(), D(), g();
  } catch (e) {
    console.error("Error during app initialization:", e);
  }
});
export {
  P as MAIN_DIST,
  T as RENDERER_DIST,
  p as VITE_DEV_SERVER_URL
};
