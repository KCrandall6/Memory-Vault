// src/components/upload/MediaPreview.tsx - With debugging
import { useState, useEffect } from 'react';
import { Card, Spinner, Alert } from 'react-bootstrap';
import './MediaPreview.css';

interface MediaPreviewProps {
  file: File | any | null; // Accept both browser File objects and Electron file info
}

const MediaPreview = ({ file }: MediaPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Clean up previous URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    setDebugInfo(null);
    
    if (!file) {
      setFileType('');
      return;
    }

    // Log file info for debugging
    console.log('File object:', file);
    setDebugInfo(file);

    setIsLoading(true);
    setError(null);
    
    try {
      // Determine file type from extension or type property
      let type = '';
      if (file.type) {
        // Browser File object
        type = file.type;
      } else if (file.path) {
        // Electron file object with path
        const extension = file.path.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
          type = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
          type = `video/${extension}`;
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
          type = `audio/${extension}`;
        } else if (extension === 'pdf') {
          type = 'application/pdf';
        } else {
          type = 'application/octet-stream';
        }
      }
      
      setFileType(type);
      console.log('Detected file type:', type);
      
      // Generate preview URL for browser File objects
      if (file instanceof Blob) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setIsLoading(false);
      } 
      // For Electron file objects, generate thumbnail on-the-fly
      else if (file.path) {
        generateThumbnail(file.path, type);
      }
    } catch (error) {
      console.error('Error creating preview:', error);
      setError(`Error creating preview: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);

  // Function to request thumbnail generation from Electron main process
  const generateThumbnail = async (filePath: string, fileType: string) => {
    try {
      console.log('Generating thumbnail for:', filePath, 'of type:', fileType);
      
      // Only attempt to generate thumbnails for images initially
      if (fileType.startsWith('image/')) {
        if (window.electronAPI?.getThumbnail) {
          console.log('Calling electronAPI.getThumbnail');
          const thumbnail = await window.electronAPI.getThumbnail(filePath);
          console.log('Thumbnail result:', thumbnail);
          
          if (thumbnail && thumbnail.thumbnailPath) {
            // Convert file path to URL format for renderer process
            const thumbnailUrl = `file://${thumbnail.thumbnailPath}`;
            console.log('Setting thumbnail URL:', thumbnailUrl);
            setPreviewUrl(thumbnailUrl);
          } else {
            setError('Could not generate thumbnail');
          }
        } else {
          setError('electronAPI.getThumbnail is not available');
          console.error('electronAPI.getThumbnail is not available');
        }
      } else {
        console.log('Skipping thumbnail generation for non-image file type:', fileType);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setError(`Error generating thumbnail: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  if (!file) {
    return (
      <Card className="preview-card">
        <Card.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <p className="text-muted">Select a file to preview</p>
        </Card.Body>
      </Card>
    );
  }

  const getFileTypeIcon = () => {
    if (fileType.startsWith('image/')) return '📷';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📑';
    return '📄';
  };

  const getFileName = () => {
    return file.name || (file.path ? file.path.split('\\').pop().split('/').pop() : 'Unknown file');
  };

  return (
    <Card className="preview-card">
      <Card.Header>
        <h5 className="mb-0">{getFileName()}</h5>
      </Card.Header>
      <Card.Body className="preview-container">
        {isLoading ? (
          <div className="text-center">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Generating preview...</p>
          </div>
        ) : error ? (
          <div className="text-center text-danger">
            <p>{error}</p>
            {debugInfo && (
              <details className="mt-3">
                <summary>Debug Info</summary>
                <pre className="text-start text-muted small mt-2">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ) : previewUrl && fileType.startsWith('image/') ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="preview-image"
            onError={(e) => {
              console.error('Image failed to load:', previewUrl);
              setError(`Failed to load image: ${previewUrl}`);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : previewUrl && fileType.startsWith('video/') ? (
          <video 
            src={previewUrl} 
            controls 
            className="w-100 h-100"
          >
            Your browser does not support the video tag.
          </video>
        ) : previewUrl && fileType.startsWith('audio/') ? (
          <audio 
            src={previewUrl} 
            controls 
            className="w-100"
          >
            Your browser does not support the audio tag.
          </audio>
        ) : previewUrl && fileType.includes('pdf') ? (
          <iframe 
            src={previewUrl} 
            className="pdf-preview"
            title="PDF Preview"
          />
        ) : (
          <div className="text-center">
            <div className="mb-3" style={{ fontSize: '5rem' }}>
              {getFileTypeIcon()}
            </div>
            <p className="text-muted">
              {fileType ? 'Preview not available for this file type' : 'File type unknown'}
            </p>
            <p className="text-muted small">{fileType || 'No MIME type available'}</p>
            
            {debugInfo && (
              <details className="mt-3">
                <summary>Debug Info</summary>
                <pre className="text-start text-muted small mt-2">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MediaPreview;