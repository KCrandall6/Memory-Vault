const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');

const LIBRARY_FOLDER_NAME = 'Memory Vault Library';
const ARCHIVE_FOLDER_NAME = 'Memory Vault Archive';
const DATABASE_FILENAME = 'memoryvault.db';
const SETTINGS_FILENAME = 'memory-vault-settings.json';

function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILENAME);
}

function readSettings() {
  try {
    const settingsPath = getSettingsPath();
    if (!fs.existsSync(settingsPath)) return {};
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8')) || {};
  } catch (error) {
    console.warn('Unable to read Memory Vault settings:', error);
    return {};
  }
}

function writeSettings(settings) {
  const settingsPath = getSettingsPath();
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
}

function looksLikeLibrary(libraryPath) {
  if (!libraryPath) return false;
  return fs.existsSync(path.join(libraryPath, DATABASE_FILENAME)) && fs.existsSync(path.join(libraryPath, ARCHIVE_FOLDER_NAME));
}

function hasLegacyVaultData(candidatePath) {
  if (!candidatePath) return false;
  return fs.existsSync(path.join(candidatePath, DATABASE_FILENAME)) || fs.existsSync(path.join(candidatePath, ARCHIVE_FOLDER_NAME));
}

function getLegacyVaultCandidates() {
  const candidates = [
    path.join(app.getPath('userData'), 'MemoryVault')
  ];

  if (app.isPackaged) {
    candidates.push(path.dirname(process.execPath));
  }

  return Array.from(new Set(candidates.map((candidate) => path.normalize(candidate))));
}

function adoptLegacyLibraryIfPresent() {
  const settings = readSettings();
  if (settings.activeLibraryPath) return settings.activeLibraryPath;

  const legacyPath = getLegacyVaultCandidates().find(hasLegacyVaultData);
  if (!legacyPath) return null;

  writeSettings({ ...settings, activeLibraryPath: legacyPath });
  return legacyPath;
}

function getActiveLibraryPath({ adoptLegacy = true } = {}) {
  const settings = readSettings();
  if (settings.activeLibraryPath) return settings.activeLibraryPath;
  return adoptLegacy ? adoptLegacyLibraryIfPresent() : null;
}

function setActiveLibraryPath(libraryPath) {
  const settings = readSettings();
  const normalizedLibraryPath = path.normalize(libraryPath);
  writeSettings({ ...settings, activeLibraryPath: normalizedLibraryPath });
  return normalizedLibraryPath;
}

function resolveStorageRoot() {
  const activeLibraryPath = getActiveLibraryPath();
  if (!activeLibraryPath) {
    throw new Error('No Memory Vault Library has been selected yet.');
  }
  return activeLibraryPath;
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
  LIBRARY_FOLDER_NAME,
  ARCHIVE_FOLDER_NAME,
  DATABASE_FILENAME,
  SETTINGS_FILENAME,
  getSettingsPath,
  readSettings,
  writeSettings,
  looksLikeLibrary,
  getLegacyVaultCandidates,
  adoptLegacyLibraryIfPresent,
  getActiveLibraryPath,
  setActiveLibraryPath,
  resolveStorageRoot,
  ensureStorageRoot,
  ensureArchiveDirectory,
  getDatabasePath,
  resolveArchiveFilePath,
};
