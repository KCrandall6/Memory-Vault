// electron/media-utils.js
const path = require('path');
const fs = require('fs/promises');
const { existsSync } = require('fs');
const sharp = require('sharp'); // For image processing
const ffmpeg = require('fluent-ffmpeg'); // For video processing

// Set ffmpeg paths if using packaged app
function setupFfmpeg(ffmpegPath, ffprobePath) {
  try {
    if (ffmpegPath && existsSync(ffmpegPath)) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    
    if (ffprobePath && existsSync(ffprobePath)) {
      ffmpeg.setFfprobePath(ffprobePath);
    }
  } catch (error) {
    console.error('Error setting up ffmpeg paths:', error);
  }
}

// Get MIME type based on file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Image types
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
    return `image/${ext.substring(1) === 'jpg' ? 'jpeg' : ext.substring(1)}`;
  }
  
  // Video types
  if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)) {
    return `video/${ext.substring(1) === 'mov' ? 'quicktime' : ext.substring(1)}`;
  }
  
  // Audio types
  if (['.mp3', '.wav', '.ogg', '.flac', '.aac'].includes(ext)) {
    return `audio/${ext.substring(1)}`;
  }
  
  // Document types
  if (ext === '.pdf') return 'application/pdf';
  if (['.doc', '.docx'].includes(ext)) return 'application/msword';
  if (['.xls', '.xlsx'].includes(ext)) return 'application/vnd.ms-excel';
  if (['.ppt', '.pptx'].includes(ext)) return 'application/vnd.ms-powerpoint';
  
  // Default
  return 'application/octet-stream';
}

// Generate thumbnail for image files
async function generateImageThumbnail(sourcePath, outputPath, size = 300) {
  try {
    await sharp(sourcePath)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating image thumbnail:', error);
    throw error;
  }
}

// Generate thumbnail for video files
function generateVideoThumbnail(sourcePath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(sourcePath)
      .on('error', (err) => {
        console.error('Error generating video thumbnail:', err);
        reject(err);
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .screenshots({
        timestamps: ['10%'], // Take screenshot at 10% of the video
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '300x?'
      });
  });
}

// Generate a thumbnail for any media file
async function generateThumbnail(sourcePath, outputPath) {
  try {
    const mimeType = getMimeType(sourcePath);
    
    if (mimeType.startsWith('image/')) {
      return await generateImageThumbnail(sourcePath, outputPath);
    }
    
    if (mimeType.startsWith('video/')) {
      return await generateVideoThumbnail(sourcePath, outputPath);
    }
    
    // For document types, we could generate preview of first page
    // This would require additional libraries like pdf-poppler or similar
    
    // For now, return null for unsupported types
    return null;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

// Extract metadata from media files
async function extractMetadata(filePath) {
  try {
    const mimeType = getMimeType(filePath);
    const stats = await fs.stat(filePath);
    
    const metadata = {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      mimeType
    };
    
    // For image files, extract additional metadata using sharp
    if (mimeType.startsWith('image/')) {
      try {
        const imageInfo = await sharp(filePath).metadata();
        metadata.width = imageInfo.width;
        metadata.height = imageInfo.height;
        metadata.format = imageInfo.format;
        
        // Extract EXIF data if available
        if (imageInfo.exif) {
          // Parse EXIF data - this would require exif-parser or similar library
          // For now, just add the raw buffer
          metadata.exif = true;
        }
      } catch (err) {
        console.error('Error extracting image metadata:', err);
      }
    }
    
    // For video files, extract metadata using ffprobe
    if (mimeType.startsWith('video/')) {
      try {
        metadata.videoInfo = await getVideoMetadata(filePath);
      } catch (err) {
        console.error('Error extracting video metadata:', err);
      }
    }
    
    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return { error: error.message };
  }
}

// Get video metadata using ffprobe
function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({
        duration: metadata.format.duration,
        width: metadata.streams[0].width,
        height: metadata.streams[0].height,
        codec: metadata.streams[0].codec_name
      });
    });
  });
}

module.exports = {
  setupFfmpeg,
  getMimeType,
  generateThumbnail,
  extractMetadata
};