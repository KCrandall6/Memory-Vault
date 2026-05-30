/// <reference path="./storage-root.d.ts" />
// electron/main.ts - cleaned version
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
// @ts-ignore - CommonJS helper without bundled types
import { resolveArchiveFilePath } from './storage-root.cjs';
import { testDatabase } from './db-test';

// Import database operations - keep this as CommonJS import
// @ts-ignore - ignore TypeScript error for using require with CommonJS module
import dbOperations from './database.cjs';


// Import file handler as ES module
import { 
  processMediaFile,
  ensureDirectoriesExist
} from './file-handler.js';

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

// Set up IPC handlers
function setupIpcHandlers() {
  // File selection handler
  ipcMain.handle('select-files', async () => {
    console.log('Showing file dialog...');
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

      console.log('Generating preview for:', previewPath);

      const data = await fs.readFile(previewPath);
      const base64 = data.toString('base64');
      const mimeType = getMimeType(previewPath);

      console.log('Preview generated with mime type:', mimeType);
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
      console.log('Media types from database:', types);
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

  ipcMain.handle('get-collection-media', async (_event, collectionId: number) => {
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
      console.log('Saving media:', data);
      
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
      console.log(`Media saved with ID: ${mediaId}`);
      
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

  // Open DevTools for debugging
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
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

    // Initialize database
    const dbTestResult = await testDatabase();
    console.log('Database test result:', dbTestResult);
    
    // Create necessary directories
    await ensureDirectoriesExist();
    
    setupIpcHandlers();
    createWindow();
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});