// electron/main.ts - simplified version
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
// Comment out this import for now
// import { testDatabase } from './db-test';

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
  
  // Mock data handlers
  ipcMain.handle('get-media-types', () => [
    { id: 1, name: 'Image' },
    { id: 2, name: 'Video' },
    { id: 3, name: 'Document' },
    { id: 4, name: 'Audio' }
  ]);
  
  ipcMain.handle('get-source-types', () => [
    { id: 1, name: 'Digital Camera' },
    { id: 2, name: 'Phone' },
    { id: 3, name: 'Scanned Photo' },
    { id: 4, name: 'Scanned Document' }
  ]);
  
  ipcMain.handle('get-collections', () => [
    { id: 1, name: 'Family Vacation 2023' },
    { id: 2, name: 'Wedding Anniversary' },
    { id: 3, name: 'Birthday Party' }
  ]);
  
  ipcMain.handle('get-tags', () => [
    { id: 1, name: 'family' },
    { id: 2, name: 'vacation' },
    { id: 3, name: 'birthday' }
  ]);
  
  ipcMain.handle('get-people', () => [
    { id: 1, name: 'John Smith' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Alex Johnson' }
  ]);
  
  ipcMain.handle('save-media', async (_, data) => {
    console.log('Mock saving media:', data);
    console.log('File path:', data.filePath);
    console.log('Metadata:', JSON.stringify(data.metadata, null, 2));
    return { success: true, mediaId: 1 };
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
app.whenReady().then(() => {
  try {
    // Skip database test for now
    // const dbTestResult = await testDatabase();
    // console.log('Database test result:', dbTestResult);
    
    setupIpcHandlers();
    createWindow();
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});