// electron/file-handler.js - ES Module version
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp'; // You'll need to install this: npm install sharp

// Define paths for media storage
const getAppDataPath = () => {
  // Store files in the app's data directory
  const appDataPath = path.join(app.getPath('userData'), 'MemoryVault');
  return appDataPath;
};

// Create required directories
async function ensureDirectoriesExist() {
  const mediaDir = path.join(getAppDataPath(), 'Media');
  const tempDir = path.join(getAppDataPath(), 'Temp');
  
  try {
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    return { mediaDir, tempDir };
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
      relativePath: path.join('Media', uniqueFilename)
    };
  } catch (error) {
    console.error('Error saving media file:', error);
    throw error;
  }
}

// Generate a thumbnail for image files on-the-fly
async function generateThumbnail(sourceFilePath, size = 300) {
  try {
    const { tempDir } = await ensureDirectoriesExist();
    
    // Generate a unique name for the thumbnail
    const ext = path.extname(sourceFilePath);
    const baseName = path.basename(sourceFilePath, ext);
    const thumbnailName = `${baseName}_thumb_${Date.now()}.jpg`;
    const thumbnailPath = path.join(tempDir, thumbnailName);
    
    // Generate thumbnail with sharp
    await sharp(sourceFilePath)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return {
      thumbnailPath,
      thumbnailFileName: thumbnailName,
    };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

// Process a media file - save without generating thumbnail
async function processMediaFile(filePath, fileName) {
  try {
    const fileInfo = await saveMediaFile(filePath, fileName);
    
    return {
      ...fileInfo,
      thumbnail: null // No thumbnail generated during upload
    };
  } catch (error) {
    console.error('Error processing media file:', error);
    throw error;
  }
}

// Get a thumbnail for a file - generate on-the-fly
async function getThumbnail(filePath) {
  try {
    if (!filePath || !existsSync(filePath)) {
      console.error('File not found:', filePath);
      return null;
    }
    
    // Check if we can generate a thumbnail based on file type
    const ext = path.extname(filePath).toLowerCase();
    const supportedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
    
    if (!supportedImageTypes.includes(ext)) {
      console.log('Unsupported file type for thumbnail:', ext);
      return null;
    }
    
    // Generate the thumbnail
    return await generateThumbnail(filePath);
  } catch (error) {
    console.error('Error getting thumbnail:', error);
    return null;
  }
}

// Function to clean up temporary thumbnails
// Call this periodically to prevent temp directory from growing too large
async function cleanupTempThumbnails(maxAgeMs = 24 * 60 * 60 * 1000) { // Default: 24 hours
  try {
    const { tempDir } = await ensureDirectoriesExist();
    const now = Date.now();
    
    const files = await fs.readdir(tempDir);
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      // Delete files older than maxAgeMs
      if (now - stats.mtime.getTime() > maxAgeMs) {
        try {
          await fs.unlink(filePath);
          console.log('Deleted old thumbnail:', file);
        } catch (err) {
          console.error('Error deleting thumbnail:', err);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp thumbnails:', error);
  }
}

export {
  processMediaFile,
  getAppDataPath,
  ensureDirectoriesExist,
  getThumbnail,
  cleanupTempThumbnails
};