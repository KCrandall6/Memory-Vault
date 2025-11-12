// electron/file-handler.js - cleaned version
import path from 'path';
import fs from 'fs/promises';
import storageRoot from './storage-root.cjs';

const {
  ensureStorageRoot,
  ensureArchiveDirectory,
  ARCHIVE_FOLDER_NAME
} = storageRoot;

// Define paths for media storage
const getAppDataPath = () => {
  return ensureStorageRoot();
};

// Create required directories
async function ensureDirectoriesExist() {
 
  try {
    const mediaDir = ensureArchiveDirectory();
    return { mediaDir };
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error;
  }
}

// Generate a unique filename to avoid collisions
function generateUniqueFilename(originalFilename) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalFilename);
  const name = path.basename(originalFilename, ext);
  
  return `${name}_${timestamp}_${randomString}${ext}`;
}

// Save a file to the media directory
async function saveMediaFile(sourcePath, filename) {
  try {
    const { mediaDir } = await ensureDirectoriesExist();
    const uniqueFilename = generateUniqueFilename(filename);
    const destinationPath = path.join(mediaDir, uniqueFilename);
    
    // Copy the file to the destination
    await fs.copyFile(sourcePath, destinationPath);
    
    return {
      filePath: destinationPath,
      fileName: uniqueFilename,
      relativePath: path.join(ARCHIVE_FOLDER_NAME, uniqueFilename)
    };
  } catch (error) {
    console.error('Error saving media file:', error);
    throw error;
  }
}

// Process a media file - save without generating thumbnail
async function processMediaFile(filePath, fileName) {
  try {
    const fileInfo = await saveMediaFile(filePath, fileName);
    
    return {
      ...fileInfo,
      thumbnail: null // No thumbnail
    };
  } catch (error) {
    console.error('Error processing media file:', error);
    throw error;
  }
}

export {
  processMediaFile,
  getAppDataPath,
  ensureDirectoriesExist
};