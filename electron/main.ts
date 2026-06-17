// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./storage-root.d.ts" />
// electron/main.ts - cleaned version
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
// @ts-expect-error - CommonJS helper declaration is not resolved by bundler mode
import storageRoot from './storage-root.cjs';


// Import database operations - keep this as CommonJS import
// @ts-expect-error - CommonJS database module has no TypeScript declarations
import dbOperations from './database.cjs';


// Import file handler as ES module
import { processMediaFile } from './file-handler.js';

const {
  LIBRARY_FOLDER_NAME,
  ARCHIVE_FOLDER_NAME,
  DATABASE_FILENAME,
  SETTINGS_FILENAME,
  getSettingsPath,
  looksLikeLibrary,
  isAdoptableLegacyLibrary,
  getActiveLibraryPath,
  setActiveLibraryPath,
  resolveArchiveFilePath,
  resolveStorageRoot
} = storageRoot;

// ES module compatible dirname
const currentFilePath = import.meta.url;
const currentDir = path.dirname(fileURLToPath(currentFilePath));

// Set up app paths
process.env.APP_ROOT = path.join(currentDir, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;
const APP_ICON_PATH = path.join(process.env.VITE_PUBLIC, 'memory-vault-logo.png');
const DEBUG_MEMORY_VAULT = process.env.MEMORY_VAULT_DEBUG === '1';
const OPEN_DEVTOOLS = process.env.MEMORY_VAULT_OPEN_DEVTOOLS === '1';
function debugLog(...args: unknown[]) {
  if (DEBUG_MEMORY_VAULT) console.log(...args);
}


function resolvePreviewFilePath(filePathOrUrl: string): string | null {
  if (!filePathOrUrl) return null;

  if (filePathOrUrl.startsWith('file://')) {
    return fileURLToPath(filePathOrUrl);
  }

  if (/^(data|blob|https?):/i.test(filePathOrUrl)) {
    return null;
  }

  return resolveArchiveFilePath(filePathOrUrl) || filePathOrUrl;
}

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase().substring(1);

  if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'wav') return 'audio/wav';

  return 'application/octet-stream';
}


type VaultFileDetail = {
  id?: number;
  title?: string | null;
  fileName: string;
  filePath: string;
  mediaType?: string | null;
};

type VaultMediaRecord = {
  id: number;
  title?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  media_type?: string | null;
};

type VaultCopyType = 'backup' | 'shareable-copy';

type CopyStats = {
  copiedFileCount: number;
  totalBytesCopied: number;
};

type VaultCopyResult = {
  success: boolean;
  destinationPath?: string;
  copiedFileCount?: number;
  totalBytesCopied?: number;
  canceled?: boolean;
  error?: string;
};

const createdVaultOutputFolders = new Set<string>();

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function getFileSize(targetPath: string): Promise<number> {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isFile() ? stats.size : 0;
  } catch {
    return 0;
  }
}

async function getDirectorySize(targetPath: string): Promise<number> {
  let total = 0;

  async function walk(directory: string) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile()) {
        total += await getFileSize(entryPath);
      }
    }));
  }

  await walk(targetPath);
  return total;
}

async function listArchiveFiles(archivePath: string, vaultRoot: string): Promise<Array<{ absolutePath: string; relativePath: string; size: number }>> {
  const files: Array<{ absolutePath: string; relativePath: string; size: number }> = [];

  async function walk(directory: string) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile()) {
        const relativePath = path.relative(vaultRoot, entryPath).replace(/\\/g, '/');
        files.push({
          absolutePath: entryPath,
          relativePath,
          size: await getFileSize(entryPath)
        });
      }
    }
  }

  await walk(archivePath);
  return files;
}

async function getDiskStats(targetPath: string) {
  try {
    const stats = await fs.statfs(targetPath);
    const freeBytes = Number(stats.bavail) * Number(stats.bsize);
    const totalBytes = Number(stats.blocks) * Number(stats.bsize);
    const usedBytes = Math.max(totalBytes - freeBytes, 0);
    const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : null;
    return { freeBytes, totalBytes, usedBytes, usedPercent };
  } catch (error) {
    console.warn('Disk statistics unavailable:', error);
    return { freeBytes: null, totalBytes: null, usedBytes: null, usedPercent: null };
  }
}

function getVaultPaths() {
  const vaultRoot = resolveStorageRoot();
  const archivePath = path.join(vaultRoot, ARCHIVE_FOLDER_NAME);
  const databasePath = path.join(vaultRoot, DATABASE_FILENAME);

  return {
    vaultRoot,
    libraryPath: vaultRoot,
    settingsPath: getSettingsPath(),
    settingsFileName: SETTINGS_FILENAME,
    databasePath,
    databaseFileName: DATABASE_FILENAME,
    archivePath,
    archiveFolderName: ARCHIVE_FOLDER_NAME
  };
}

async function initializeSelectedLibrary(libraryPath: string) {
  await fs.mkdir(libraryPath, { recursive: true });
  await fs.mkdir(path.join(libraryPath, ARCHIVE_FOLDER_NAME), { recursive: true });
  setActiveLibraryPath(libraryPath);
  dbOperations.resetDatabaseConnection?.();
  dbOperations.initializeDatabase?.();
  return getVaultPaths();
}

async function validateLibraryPath(candidatePath: string): Promise<{ valid: boolean; libraryPath?: string; error?: string }> {
  if (!candidatePath) return { valid: false, error: 'Please choose a Memory Vault Library folder.' };
  if (looksLikeLibrary(candidatePath)) return { valid: true, libraryPath: candidatePath };

  const childLibraryPath = path.join(candidatePath, LIBRARY_FOLDER_NAME);
  if (looksLikeLibrary(childLibraryPath)) return { valid: true, libraryPath: childLibraryPath };

  return {
    valid: false,
    error: 'This does not look like a Memory Vault Library. Please choose a folder that contains memoryvault.db and Memory Vault Archive.'
  };
}

async function chooseCreateNewLibrary(): Promise<{ success: boolean; canceled?: boolean; paths?: ReturnType<typeof getVaultPaths>; error?: string }> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Choose where to keep your memories',
    properties: ['openDirectory', 'createDirectory']
  });

  if (canceled || filePaths.length === 0) return { success: false, canceled: true };

  const parentPath = filePaths[0];
  const preferredLibraryPath = path.join(parentPath, LIBRARY_FOLDER_NAME);
  let libraryPath = preferredLibraryPath;

  if (await pathExists(preferredLibraryPath)) {
    if (looksLikeLibrary(preferredLibraryPath)) {
      const paths = await initializeSelectedLibrary(preferredLibraryPath);
      return { success: true, paths };
    }
    libraryPath = await resolveUniqueChildDirectory(parentPath, LIBRARY_FOLDER_NAME);
  }

  const paths = await initializeSelectedLibrary(libraryPath);
  return { success: true, paths };
}

async function chooseOpenExistingLibrary(): Promise<{ success: boolean; canceled?: boolean; paths?: ReturnType<typeof getVaultPaths>; error?: string }> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Open an Existing Memory Vault Library',
    properties: ['openDirectory']
  });

  if (canceled || filePaths.length === 0) return { success: false, canceled: true };

  const validation = await validateLibraryPath(filePaths[0]);
  if (!validation.valid || !validation.libraryPath) {
    return { success: false, error: validation.error };
  }

  const paths = await initializeSelectedLibrary(validation.libraryPath);
  return { success: true, paths };
}

function getLibraryStatus() {
  const configuredLibraryPath = getActiveLibraryPath({ adoptLegacy: false });
  if (configuredLibraryPath) {
    if (!looksLikeLibrary(configuredLibraryPath)) {
      return { configured: false, activeLibraryPath: null, paths: null };
    }

    try {
      dbOperations.initializeDatabase?.();
    } catch (error) {
      console.error('Unable to initialize active Memory Vault Library:', error);
      return { configured: false, activeLibraryPath: null, paths: null };
    }

    return { configured: true, activeLibraryPath: configuredLibraryPath, paths: getVaultPaths() };
  }

  const adoptedLegacyPath = getActiveLibraryPath({ adoptLegacy: true });
  if (!adoptedLegacyPath || !isAdoptableLegacyLibrary(adoptedLegacyPath)) {
    return { configured: false, activeLibraryPath: null, paths: null };
  }

  try {
    dbOperations.initializeDatabase?.();
  } catch (error) {
    console.error('Unable to initialize legacy Memory Vault Library:', error);
    return { configured: false, activeLibraryPath: null, paths: null };
  }

  return { configured: true, activeLibraryPath: adoptedLegacyPath, paths: getVaultPaths() };
}


function formatTimestampForFolder(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

async function resolveUniqueChildDirectory(parentPath: string, baseName: string) {
  let candidate = path.join(parentPath, baseName);
  let suffix = 2;

  while (await pathExists(candidate)) {
    candidate = path.join(parentPath, `${baseName}-${suffix}`);
    suffix += 1;
  }

  return candidate;
}

async function copyFileWithStats(sourcePath: string, destinationPath: string, stats: CopyStats) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
  stats.copiedFileCount += 1;
  stats.totalBytesCopied += await getFileSize(sourcePath);
}

async function copyDirectoryWithStats(sourceDirectory: string, destinationDirectory: string, stats: CopyStats) {
  await fs.mkdir(destinationDirectory, { recursive: true });
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(destinationDirectory, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryWithStats(sourcePath, destinationPath, stats);
    } else if (entry.isFile()) {
      await copyFileWithStats(sourcePath, destinationPath, stats);
    }
  }
}

async function writeTextFileWithStats(destinationPath: string, contents: string, stats: CopyStats) {
  await fs.writeFile(destinationPath, contents, 'utf8');
  stats.copiedFileCount += 1;
  stats.totalBytesCopied += new TextEncoder().encode(contents).length;
}

function buildShareableCopyReadme() {
  return `Memory Vault Shareable Copy\n\nThis folder contains Memory Vault library data. To open it, install Memory Vault and choose Open an Existing Library.\n\nWhat's included:\n- memoryvault.db\n- Memory Vault Archive/\n- copy-info.json\n\nKeep this folder together so Memory Vault can recognize it as an existing Memory Vault Library.\n`;
}


async function createVaultCopy(copyType: VaultCopyType): Promise<VaultCopyResult> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: copyType === 'backup' ? 'Choose backup destination' : 'Choose shareable copy destination',
    properties: ['openDirectory', 'createDirectory']
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  const destinationParent = filePaths[0];
  const paths = getVaultPaths();
  const [databaseExists, archiveExists] = await Promise.all([
    pathExists(paths.databasePath),
    pathExists(paths.archivePath)
  ]);

  if (!databaseExists) {
    return { success: false, error: 'The vault database file could not be found, so the copy was not created.' };
  }

  if (!archiveExists) {
    return { success: false, error: 'The media archive folder could not be found, so the copy was not created.' };
  }

  const folderPrefix = copyType === 'backup' ? 'MemoryVault-Backup' : 'MemoryVault-Shareable-Copy';
  const outputFolder = await resolveUniqueChildDirectory(destinationParent, `${folderPrefix}-${formatTimestampForFolder()}`);
  const stats: CopyStats = { copiedFileCount: 0, totalBytesCopied: 0 };
  const vaultStatistics = await dbOperations.getVaultStatistics();
  const databaseSizeBytes = await getFileSize(paths.databasePath);
  const archiveSizeBytes = await getDirectorySize(paths.archivePath);

  await fs.mkdir(outputFolder, { recursive: false });
  await copyFileWithStats(paths.databasePath, path.join(outputFolder, paths.databaseFileName), stats);
  await copyDirectoryWithStats(paths.archivePath, path.join(outputFolder, paths.archiveFolderName), stats);

  const manifest = {
    createdAt: new Date().toISOString(),
    backupType: copyType === 'backup' ? 'backup' : 'shareable-copy',
    sourceVaultPath: paths.vaultRoot,
    databaseFileName: paths.databaseFileName,
    databaseSizeBytes,
    archiveFolderName: paths.archiveFolderName,
    archiveSizeBytes,
    mediaCount: vaultStatistics?.totals?.totalMemories ?? null,
    appVersion: app.getVersion?.() || null
  };

  const manifestFileName = copyType === 'backup' ? 'backup-info.json' : 'copy-info.json';
  await writeTextFileWithStats(path.join(outputFolder, manifestFileName), `${JSON.stringify(manifest, null, 2)}\n`, stats);

  if (copyType === 'shareable-copy') {
    await writeTextFileWithStats(path.join(outputFolder, 'README-Start-Here.txt'), buildShareableCopyReadme(), stats);
  }

  createdVaultOutputFolders.add(path.normalize(outputFolder));

  return {
    success: true,
    destinationPath: outputFolder,
    copiedFileCount: stats.copiedFileCount,
    totalBytesCopied: stats.totalBytesCopied
  };
}

async function buildVaultHealth() {
  const paths = getVaultPaths();
  const [vaultRootExists, databaseExists, archiveExists] = await Promise.all([
    pathExists(paths.vaultRoot),
    pathExists(paths.databasePath),
    pathExists(paths.archivePath)
  ]);

  const warnings: string[] = [];
  if (!vaultRootExists) warnings.push('Vault folder is missing or cannot be accessed.');
  if (!databaseExists) warnings.push('Database file is missing.');
  if (!archiveExists) warnings.push('Media archive folder is missing.');

  const statistics = await dbOperations.getVaultStatistics();
  if (!statistics.databaseConnected) {
    warnings.push('Database connection is unavailable.');
  }

  const archiveFiles = archiveExists ? await listArchiveFiles(paths.archivePath, paths.vaultRoot) : [];
  const referencedRelativePaths = new Set<string>();
  const missingFiles: VaultFileDetail[] = [];

  await Promise.all(((statistics.mediaFiles || []) as VaultMediaRecord[]).map(async (media) => {
    const rawPath = String(media.file_path || '');
    if (!rawPath) return;

    const absolutePath = resolveArchiveFilePath(rawPath);
    const relativePath = path.isAbsolute(rawPath)
      ? path.relative(paths.vaultRoot, rawPath).replace(/\\/g, '/')
      : rawPath.replace(/\\/g, '/');

    referencedRelativePaths.add(relativePath);
    if (!absolutePath || !(await pathExists(absolutePath))) {
      missingFiles.push({
        id: media.id,
        title: media.title,
        fileName: media.file_name || path.basename(rawPath),
        filePath: rawPath,
        mediaType: media.media_type
      });
    }
  }));

  const orphanFiles = archiveFiles
    .filter((file) => !referencedRelativePaths.has(file.relativePath))
    .map((file) => ({
      fileName: path.basename(file.absolutePath),
      filePath: file.relativePath,
      size: file.size
    }));

  const [databaseSizeBytes, archiveSizeBytes, disk] = await Promise.all([
    getFileSize(paths.databasePath),
    archiveExists ? getDirectorySize(paths.archivePath) : Promise.resolve(0),
    getDiskStats(paths.vaultRoot)
  ]);

  const status = warnings.length === 0 && missingFiles.length === 0 ? 'healthy' : 'needs_attention';

  return {
    paths,
    health: {
      status,
      vaultRoot: vaultRootExists ? 'healthy' : 'missing',
      databaseFile: databaseExists ? 'healthy' : 'missing',
      archiveFolder: archiveExists ? 'healthy' : 'missing',
      databaseConnection: statistics.databaseConnected ? 'healthy' : 'unknown',
      warnings
    },
    storage: {
      archiveSizeBytes,
      databaseSizeBytes,
      diskFreeBytes: disk.freeBytes,
      diskTotalBytes: disk.totalBytes,
      diskUsedBytes: disk.usedBytes,
      diskUsedPercent: disk.usedPercent
    },
    totals: statistics.totals,
    integrity: {
      missingFilesCount: missingFiles.length,
      orphanFilesCount: orphanFiles.length,
      missingFiles: missingFiles.slice(0, 20),
      orphanFiles: orphanFiles.slice(0, 20)
    }
  };
}

// Set up IPC handlers
function setupIpcHandlers() {

  ipcMain.handle('get-library-status', async () => getLibraryStatus());

  ipcMain.handle('choose-create-new-library', async () => {
    try {
      return await chooseCreateNewLibrary();
    } catch (error) {
      console.error('Error creating Memory Vault Library:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unable to create Memory Vault Library.' };
    }
  });

  ipcMain.handle('choose-open-existing-library', async () => {
    try {
      return await chooseOpenExistingLibrary();
    } catch (error) {
      console.error('Error opening Memory Vault Library:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unable to open Memory Vault Library.' };
    }
  });

  ipcMain.handle('get-library-paths', async () => getVaultPaths());

  ipcMain.handle('get-vault-settings', async () => {
    try {
      return getVaultPaths();
    } catch (error) {
      console.error('Error getting vault settings:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('open-vault-folder', async () => {
    try {
      const result = await shell.openPath(getVaultPaths().vaultRoot);
      return { success: result.length === 0, error: result || undefined };
    } catch (error) {
      console.error('Error opening vault folder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('open-archive-folder', async () => {
    try {
      const result = await shell.openPath(getVaultPaths().archivePath);
      return { success: result.length === 0, error: result || undefined };
    } catch (error) {
      console.error('Error opening archive folder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('get-vault-health', async () => {
    try {
      return await buildVaultHealth();
    } catch (error) {
      console.error('Error getting vault health:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('create-vault-backup', async () => {
    try {
      return await createVaultCopy('backup');
    } catch (error) {
      console.error('Error creating vault backup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('create-vault-shareable-copy', async () => {
    try {
      return await createVaultCopy('shareable-copy');
    } catch (error) {
      console.error('Error creating vault shareable copy:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('open-vault-output-folder', async (_event, folderPath: string) => {
    try {
      const normalizedFolderPath = path.normalize(folderPath || '');
      if (!createdVaultOutputFolders.has(normalizedFolderPath)) {
        return { success: false, error: 'This folder was not created during the current Memory Vault session.' };
      }

      const result = await shell.openPath(normalizedFolderPath);
      return { success: result.length === 0, error: result || undefined };
    } catch (error) {
      console.error('Error opening vault output folder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // File selection handler
  ipcMain.handle('select-files', async () => {
    debugLog('Showing file dialog...');
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'pdf', 'doc', 'docx'] }
      ]
    });
    
    if (canceled) {
      return [];
    }
    
    // Return basic file info
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
  
  // File preview handler
  ipcMain.handle('get-file-preview', async (_, filePathOrUrl: string) => {
    try {
      const previewPath = resolvePreviewFilePath(filePathOrUrl);
      if (!previewPath) {
        return null;
      }

      debugLog('Generating preview for:', previewPath);

      const data = await fs.readFile(previewPath);
      const base64 = data.toString('base64');
      const mimeType = getMimeType(previewPath);

      debugLog('Preview generated with mime type:', mimeType);
      return {
        dataUrl: `data:${mimeType};base64,${base64}`,
        mimeType
      };
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  });
  
  // Database query handlers
  ipcMain.handle('get-media-types', async () => {
    try {
      const types = await dbOperations.getMediaTypes();
      debugLog('Media types from database:', types);
      return types.length > 0 ? types : [
        { id: 1, name: 'Image' },
        { id: 2, name: 'Video' },
        { id: 3, name: 'Document' },
        { id: 4, name: 'Audio' }
      ];
    } catch (error) {
      console.error('Error getting media types:', error);
      return [
        { id: 1, name: 'Image' },
        { id: 2, name: 'Video' },
        { id: 3, name: 'Document' },
        { id: 4, name: 'Audio' }
      ];
    }
  });
  
  ipcMain.handle('get-collections', async () => {
    try {
      return await dbOperations.getCollections();
    } catch (error) {
      console.error('Error getting collections:', error);
      return [
        { id: 1, name: 'Family Vacation 2023' },
        { id: 2, name: 'Wedding Anniversary' },
        { id: 3, name: 'Birthday Party' }
      ];
    }
  });
  
  ipcMain.handle('get-tags', async () => {
    try {
      return await dbOperations.getTags();
    } catch (error) {
      console.error('Error getting tags:', error);
      return [
        { id: 1, name: 'family' },
        { id: 2, name: 'vacation' },
        { id: 3, name: 'birthday' }
      ];
    }
  });
  
  ipcMain.handle('get-people', async () => {
    try {
      return await dbOperations.getPeople();
    } catch (error) {
      console.error('Error getting people:', error);
      return [
        { id: 1, name: 'John Smith' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Alex Johnson' }
      ];
    }
  });
  
    ipcMain.handle('search-media', async (_event, criteria) => {
    try {
      return await dbOperations.searchMedia(criteria);
    } catch (error) {
      console.error('Error searching media:', error);
      return [];
    }
  });

  ipcMain.handle('get-media-details', async (_event, id: number) => {
    try {
      return await dbOperations.getMediaDetails(id);
    } catch (error) {
      console.error('Error fetching media details:', error);
      return null;
    }
  });

  ipcMain.handle('get-dashboard-summary', async () => {
    try {
      return await dbOperations.getDashboardSummary();
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return {
        totalMedia: 0,
        collectionsCount: 0,
        peopleCount: 0,
        tagsCount: 0,
        mediaTypeCounts: {}
      };
    }
  });


  ipcMain.handle('get-collection-summaries', async () => {
    try {
      return await dbOperations.getCollectionSummaries();
    } catch (error) {
      console.error('Error getting collection summaries:', error);
      return [];
    }
  });

  ipcMain.handle('get-collection-media', async (_event, collectionId: number | string) => {
    try {
      return await dbOperations.getCollectionMedia(collectionId);
    } catch (error) {
      console.error('Error getting collection media:', error);
      return [];
    }
  });

  ipcMain.handle('get-people-summaries', async () => {
    try {
      return await dbOperations.getPeopleSummaries();
    } catch (error) {
      console.error('Error getting people summaries:', error);
      return [];
    }
  });

  ipcMain.handle('get-person-media', async (_event, personId: number) => {
    try {
      return await dbOperations.getPersonMedia(personId);
    } catch (error) {
      console.error('Error getting person media:', error);
      return [];
    }
  });

  ipcMain.handle('get-tag-summaries', async () => {
    try {
      return await dbOperations.getTagSummaries();
    } catch (error) {
      console.error('Error getting tag summaries:', error);
      return [];
    }
  });

  ipcMain.handle('get-tag-media', async (_event, tagId: number) => {
    try {
      return await dbOperations.getTagMedia(tagId);
    } catch (error) {
      console.error('Error getting tag media:', error);
      return [];
    }
  });

  ipcMain.handle('get-date-summaries', async () => {
    try {
      return await dbOperations.getDateSummaries();
    } catch (error) {
      console.error('Error getting date summaries:', error);
      return [];
    }
  });

  ipcMain.handle('get-date-media', async (_event, year: string) => {
    try {
      return await dbOperations.getDateMedia(year);
    } catch (error) {
      console.error('Error getting date media:', error);
      return [];
    }
  });


  ipcMain.handle('update-collection-details', async (_event, payload: { id: number; name: string; description?: string }) => {
    try {
      const collection = await dbOperations.updateCollectionDetails(payload.id, {
        name: payload.name,
        description: payload.description || ''
      });
      return { success: true, collection };
    } catch (error) {
      console.error('Error updating collection details:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('delete-collection', async (_event, id: number) => {
    try {
      return await dbOperations.deleteCollectionIfEmpty(id);
    } catch (error) {
      console.error('Error deleting collection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('delete-media', async (_event, id: number) => {
    try {
      const deleted = await dbOperations.deleteMedia(id);
      return { success: deleted };
    } catch (error) {
      console.error('Error deleting media:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });


  ipcMain.handle('get-memory-notes', async (_event, mediaId: number) => {
    try {
      return await dbOperations.getMemoryNotes(mediaId);
    } catch (error) {
      console.error('Error getting memory notes:', error);
      return [];
    }
  });

  ipcMain.handle('add-memory-note', async (_event, mediaId: number, payload: { authorName?: string; content: string }) => {
    try {
      const note = await dbOperations.addMemoryNote(mediaId, payload);
      return { success: true, note };
    } catch (error) {
      console.error('Error adding memory note:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('update-media-details', async (_event, payload) => {
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
      console.error('Error updating media details:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

    ipcMain.handle('download-media-file', async (_event, payload: { filePath: string; defaultFileName?: string }) => {
    try {
      const absolutePath = resolveArchiveFilePath(payload.filePath);
      if (!absolutePath) {
        throw new Error('File path was not provided.');
      }

      const defaultFileName = payload.defaultFileName || path.basename(absolutePath);
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: defaultFileName,
        title: 'Save media as'
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      await fs.copyFile(absolutePath, filePath);
      return { success: true };
    } catch (error) {
      console.error('Error downloading media file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Save media handler
  ipcMain.handle('save-media', async (_, data) => {
    try {
      debugLog('Saving media:', data);
      
      // Process the file
      const processedFile = await processMediaFile(data.filePath, path.basename(data.filePath));
      
      // Prepare media data for database
      const mediaData: {
        file_name: string;
        file_path: string;
        thumbnail_path: string | null;
        title: string;
        description: string;
        media_type_id: number;
        source_type_id: number | null;
        capture_date: string | null;
        location: string | null;
        collection_id: number | null;
      } = {
        file_name: processedFile.fileName,
        file_path: processedFile.relativePath,
        thumbnail_path: null,
        title: data.metadata.title,
        description: data.metadata.description,
        media_type_id: parseInt(data.metadata.mediaTypeId),
        source_type_id: data.metadata.sourceTypeId ? parseInt(data.metadata.sourceTypeId) : null,
        capture_date: data.metadata.captureDate || null,
        location: data.metadata.location || null,
        collection_id: null // Will be set below
      };
      
      // Process collection
      if (data.metadata.collection) {
        const collection = data.metadata.collection;
        // If collection has negative ID, it's a new collection
        const collectionId = collection.id < 0 
          ? await dbOperations.addCollection(collection.name, collection.description || '')
          : collection.id;
        
        mediaData.collection_id = collectionId;
      } else if (data.metadata.collectionId) {
        mediaData.collection_id = parseInt(data.metadata.collectionId);
      }
      
      // Save media record to database
      const mediaId = await dbOperations.addMedia(mediaData);
      debugLog(`Media saved with ID: ${mediaId}`);
      
      // Process tags
      if (data.metadata.tags && data.metadata.tags.length > 0) {
        for (const tag of data.metadata.tags) {
          // If tag has negative ID, it's a new tag
          const tagId = tag.id < 0 
            ? await dbOperations.addTag(tag.name)
            : tag.id;
          
          await dbOperations.linkTagToMedia(mediaId, tagId);
        }
      }
      
      // Process people
      if (data.metadata.people && data.metadata.people.length > 0) {
        for (const person of data.metadata.people) {
          if (!person?.name) continue;

          const resolvedId = typeof person.id !== 'number' || person.id < 0
            ? await dbOperations.addPerson(person.name)
            : Number(person.id);

          await dbOperations.linkPersonToMedia(mediaId, resolvedId);
        }
      }
      
      return { success: true, mediaId };
    } catch (error) {
      console.error('Error saving media:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  });
}

// Window management
let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: APP_ICON_PATH,
    webPreferences: {
      preload: path.join(currentDir, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    width: 1200,
    height: 800,
  });

  if (VITE_DEV_SERVER_URL && OPEN_DEVTOOLS) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// App initialization
app.whenReady().then(async () => {
  try {
    app.setName('Memory Vault');
    app.setAppUserModelId('com.memoryvault.app');

    if (process.platform === 'darwin' && app.dock) {
      app.dock.setIcon(APP_ICON_PATH);
    }

    // Database and archive directories are initialized after a Memory Vault Library is selected.
    getLibraryStatus();

    setupIpcHandlers();
    createWindow();
    
    debugLog('App initialized successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});