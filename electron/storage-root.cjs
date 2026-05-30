const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');

const ARCHIVE_FOLDER_NAME = 'Memory Vault Archive';
const DATABASE_FILENAME = 'memoryvault.db';

function resolveStorageRoot() {
  if (app.isPackaged) {
    return path.dirname(process.execPath);
  }
  return path.join(app.getPath('userData'), 'MemoryVault');
}

function ensureStorageRoot() {
  const root = resolveStorageRoot();
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  return root;
}

function ensureArchiveDirectory() {
  const root = ensureStorageRoot();
  const archiveDir = path.join(root, ARCHIVE_FOLDER_NAME);
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  return archiveDir;
}

function resolveArchiveFilePath(relativePath) {
  if (!relativePath) return null;
  const cleaned = relativePath.startsWith('file://') ? fileURLToPath(relativePath) : relativePath;
  const normalized = cleaned.replace(/\\/g, '/');
  if (path.isAbsolute(normalized)) return normalized;
  return path.join(resolveStorageRoot(), normalized);
}

function getDatabasePath() {
  const root = ensureStorageRoot();
  return path.join(root, DATABASE_FILENAME);
}

module.exports = {
  ARCHIVE_FOLDER_NAME,
  DATABASE_FILENAME,
  resolveStorageRoot,
  ensureStorageRoot,
  ensureArchiveDirectory,
  getDatabasePath,
  resolveArchiveFilePath,
};