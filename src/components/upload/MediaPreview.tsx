// src/components/upload/MediaPreview.tsx - cleaned version
import { useState, useEffect } from 'react';
import { Card, Spinner } from 'react-bootstrap';

interface MediaPreviewProps {
  file: File | any;
}

const MediaPreview = ({ file }: MediaPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Clean up previous URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    if (!file) {
      return;
    }
    
    // Store debug info
    setDebugInfo(file);
    console.log('File to preview:', file);
    
    setIsLoading(true);
    setError(null);

    // Browser File object
    if (file instanceof Blob) {
      setFileType(file.type || '');
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsLoading(false);
    }
    // Electron file object
    else if (file.path) {
      const extension = file.path.toLowerCase().split('.').pop();
      console.log('File extension:', extension);
      
      // Get preview using IPC
      if (window.electronAPI?.getFilePreview) {
        console.log('Requesting file preview for:', file.path);
        
        window.electronAPI.getFilePreview(file.path)
          .then(result => {
            console.log('Preview result:', result ? 'Success' : 'Failed');
            
            if (result) {
              setPreviewUrl(result.dataUrl);
              setFileType(result.mimeType);
            } else {
              setError('Could not generate preview');
            }
            setIsLoading(false);
          })
          .catch(err => {
            console.error('Error getting file preview:', err);
            setError(`Error loading preview: ${err.message || 'Unknown error'}`);
            setIsLoading(false);
          });
      } else {
        console.error('getFilePreview method not available');
        setError('Preview generation not available');
        setIsLoading(false);
      }
    }

    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);

  if (!file) {
    return (
      <Card className="preview-card">
        <Card.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <p className="text-muted">Select a file to preview</p>
        </Card.Body>
      </Card>
    );
  }

  const getFileName = () => {
    if (file.name) return file.name;
    if (file.path) {
      const parts = file.path.split(/[/\\]/);
      return parts[parts.length - 1];
    }
    return 'Unknown file';
  };

  return (
    <Card className="preview-card">
      <Card.Header>
        <h5 className="mb-0">{getFileName()}</h5>
      </Card.Header>
      <Card.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        {isLoading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading preview...</p>
          </div>
        ) : error ? (
          <div className="text-center text-danger">
            <p>{error}</p>
            
            {/* Debug information section */}
            <details className="mt-3">
              <summary className="text-secondary">Debug Info</summary>
              <div className="mt-2 text-start">
                <p className="small">File path: {file.path || 'N/A'}</p>
                <p className="small">File type: {file.type || 'N/A'}</p>
                <p className="small">File size: {file.size ? `${Math.round(file.size / 1024)} KB` : 'N/A'}</p>
              </div>
            </details>
          </div>
        ) : previewUrl && fileType.startsWith('image/') ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="img-fluid" 
            style={{ maxHeight: '300px' }}
            onError={(e) => {
              console.error('Image failed to load:', previewUrl.substring(0, 100) + '...');
              setError('Failed to load image preview');
            }}
          />
        ) : previewUrl && fileType.startsWith('video/') ? (
          <video 
            src={previewUrl} 
            controls 
            className="w-100" 
            style={{ maxHeight: '300px' }}
          >
            Your browser does not support the video tag.
          </video>
        ) : previewUrl && fileType === 'application/pdf' ? (
          <iframe 
            src={previewUrl} 
            title="PDF preview" 
            width="100%" 
            height="300px" 
            style={{ border: 'none' }}
          />
        ) : (
          <div className="text-center">
            <div className="mb-3" style={{ fontSize: '3rem' }}>
              {fileType.startsWith('image/') && '📷'}
              {fileType.startsWith('video/') && '🎥'}
              {fileType.startsWith('audio/') && '🎵'}
              {fileType.includes('pdf') && '📑'}
              {!fileType.startsWith('image/') && 
               !fileType.startsWith('video/') && 
               !fileType.startsWith('audio/') && 
               !fileType.includes('pdf') && '📄'}
            </div>
            <p className="text-muted">
              {fileType ? 'Preview not available for this file type' : 'File type unknown'}
            </p>
            <p className="text-muted small">{fileType || 'No MIME type available'}</p>
            
            {/* Debug information section */}
            <details className="mt-3">
              <summary className="text-secondary">Debug Info</summary>
              <div className="mt-2 text-start">
                <p className="small">File path: {file.path || 'N/A'}</p>
                <p className="small">File type: {file.type || 'N/A'}</p>
                <p className="small">File size: {file.size ? `${Math.round(file.size / 1024)} KB` : 'N/A'}</p>
              </div>
            </details>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MediaPreview;