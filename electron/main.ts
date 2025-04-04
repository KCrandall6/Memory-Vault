// electron/main.ts - updated for ES modules
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { testDatabase } from './db-test';

// Import database operations - keep this as CommonJS import
// @ts-ignore - ignore TypeScript error for using require with CommonJS module
import dbOperations from './database.cjs';

// Import file handler as ES module
import { 
  processMediaFile,
  getAppDataPath,
  ensureDirectoriesExist,
  getThumbnail,
  cleanupTempThumbnails
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
  
// Thumbnail generation handler (on-the-fly)
ipcMain.handle('get-thumbnail', async (_, filePath) => {
  try {
    console.log('getThumbnail called for:', filePath);
    
    if (!filePath) {
      console.log('No file path provided for thumbnail');
      return null;
    }
    
    console.log('Generating thumbnail for:', filePath);
    const thumbnail = await fileHandler.getThumbnail(filePath);
    
    if (thumbnail) {
      console.log('Thumbnail generated successfully:', thumbnail.thumbnailPath);
      return {
        thumbnailPath: thumbnail.thumbnailPath,
        thumbnailFileName: thumbnail.thumbnailFileName
      };
    } else {
      console.log('Failed to generate thumbnail - null result');
      return null;
    }
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
});
  
  // Database query handlers
  ipcMain.handle('get-media-types', async () => {
    try {
      return await dbOperations.getMediaTypes();
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
  
  ipcMain.handle('get-source-types', async () => {
    try {
      return await dbOperations.getSourceTypes();
    } catch (error) {
      console.error('Error getting source types:', error);
      return [
        { id: 1, name: 'Digital Camera' },
        { id: 2, name: 'Phone' },
        { id: 3, name: 'Scanned Photo' },
        { id: 4, name: 'Scanned Document' }
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
  
  // Save media handler (no thumbnail generation during upload)
  ipcMain.handle('save-media', async (_, data) => {
    try {
      console.log('Saving media:', data);
      
      // Process the file (save only, no thumbnail generation)
      const processedFile = await processMediaFile(data.filePath, path.basename(data.filePath));
      
      // Prepare media data for database
      const mediaData = {
        file_name: processedFile.fileName,
        file_path: processedFile.relativePath,
        thumbnail_path: null, // No thumbnails stored in database
        title: data.metadata.title,
        description: data.metadata.description,
        media_type_id: parseInt(data.metadata.mediaTypeId),
        source_type_id: data.metadata.sourceTypeId ? parseInt(data.metadata.sourceTypeId) : null,
        capture_date: data.metadata.captureDate || null,
        location: data.metadata.location || null,
        collection_id: data.metadata.collectionId ? parseInt(data.metadata.collectionId) : null
      };
      
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
          // If person has negative ID, it's a new person
          const personId = person.id < 0 
            ? await dbOperations.addPerson(person.name)
            : person.id;
          
          await dbOperations.linkPersonToMedia(mediaId, personId);
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
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(currentDir, 'preload.mjs'),
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

// Cleanup old temp thumbnails every few hours
let cleanupInterval: NodeJS.Timeout | null = null;

// App initialization
app.whenReady().then(async () => {
  try {
    // Initialize database
    const dbTestResult = await testDatabase();
    console.log('Database test result:', dbTestResult);
    
    // Create necessary directories
    await ensureDirectoriesExist();
    
    // Set up periodic cleanup of temporary thumbnails (every 6 hours)
    cleanupInterval = setInterval(() => {
      cleanupTempThumbnails();
    }, 6 * 60 * 60 * 1000);
    
    setupIpcHandlers();
    createWindow();
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});

app.on('quit', () => {
  // Clean up the interval when the app quits
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
});