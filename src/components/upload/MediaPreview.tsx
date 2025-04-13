// src/components/upload/MediaPreview.tsx - with expand and zoom
import { useState, useEffect, useRef } from 'react';
import { Card, Spinner, Modal, Button } from 'react-bootstrap';

interface MediaPreviewProps {
  file: File | any;
}

const MediaPreview = ({ file }: MediaPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // For expand and zoom features
  const [showFullscreen, setShowFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Clean up previous URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    // Reset zoom and fullscreen when file changes
    setZoomLevel(1);
    setShowFullscreen(false);
    setIsZooming(false);

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

  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 5)); // Max zoom 5x
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5)); // Min zoom 0.5x
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Handle image hover zoom
  const handleMouseEnter = () => {
    if (fileType.startsWith('image/')) {
      setIsZooming(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isZooming || !imageRef.current) return;
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    // Move the image based on cursor position
    if (imageRef.current) {
      imageRef.current.style.transformOrigin = `${x * 100}% ${y * 100}%`;
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

  const getFileName = () => {
    if (file.name) return file.name;
    if (file.path) {
      const parts = file.path.split(/[/\\]/);
      return parts[parts.length - 1];
    }
    return 'Unknown file';
  };

  // Render fullscreen modal
  const renderFullscreen = () => {
    if (!showFullscreen) return null;

    return (
      <Modal 
        show={showFullscreen} 
        onHide={() => setShowFullscreen(false)} 
        fullscreen={true}
        className="media-fullscreen-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{getFileName()}</Modal.Title>
          <div className="ms-auto d-flex">
            {fileType.startsWith('image/') && (
              <>
                <Button variant="outline-secondary" className="me-2" onClick={handleZoomOut}>
                  <i className="bi bi-zoom-out"></i>
                </Button>
                <Button variant="outline-secondary" className="me-2" onClick={handleResetZoom}>
                  <i className="bi bi-arrow-counterclockwise"></i>
                </Button>
                <Button variant="outline-secondary" className="me-2" onClick={handleZoomIn}>
                  <i className="bi bi-zoom-in"></i>
                </Button>
              </>
            )}
          </div>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center align-items-center bg-dark">
          {fileType.startsWith('image/') ? (
            <img 
              src={previewUrl} 
              alt="Full Preview" 
              style={{ 
                maxHeight: '90vh',
                maxWidth: '100%',
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease'
              }}
            />
          ) : fileType.startsWith('video/') ? (
            <video 
              src={previewUrl} 
              controls 
              style={{ maxHeight: '90vh', maxWidth: '100%' }}
            >
              Your browser does not support the video tag.
            </video>
          ) : fileType === 'application/pdf' ? (
            <iframe 
              src={previewUrl} 
              title="PDF preview" 
              width="100%" 
              height="90vh" 
              style={{ border: 'none' }}
            />
          ) : (
            <div className="text-center text-white">
              <p>Preview not available for this file type in fullscreen mode.</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    );
  };

  // Main component render
  return (
    <>
      <Card className="preview-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{getFileName()}</h5>
          
          {/* Add expand button for all previewable content */}
          {previewUrl && (fileType.startsWith('image/') || fileType.startsWith('video/') || fileType === 'application/pdf') && (
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => setShowFullscreen(true)}
              title="Expand preview"
            >
              <i className="bi bi-arrows-fullscreen"></i>
            </Button>
          )}
        </Card.Header>
        <Card.Body className="d-flex justify-content-center align-items-center position-relative" style={{ minHeight: '300px' }}>
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
            <div className="position-relative" style={{ overflow: 'hidden' }}>
              <img 
                ref={imageRef}
                src={previewUrl} 
                alt="Preview" 
                className="img-fluid" 
                style={{ 
                  maxHeight: '500px', 
                  transform: isZooming ? `scale(1.5)` : 'scale(1)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
                onError={(e) => {
                  console.error('Image failed to load:', previewUrl.substring(0, 100) + '...');
                  setError('Failed to load image preview');
                }}
              />
              <div className="preview-instructions position-absolute bottom-0 end-0 p-2 bg-dark bg-opacity-50 text-white rounded">
                <small>Hover to zoom</small>
              </div>
            </div>
          ) : previewUrl && fileType.startsWith('video/') ? (
            <video 
              src={previewUrl} 
              controls 
              className="w-100" 
              style={{ maxHeight: '500px' }}
            >
              Your browser does not support the video tag.
            </video>
          ) : previewUrl && fileType === 'application/pdf' ? (
            <iframe 
              src={previewUrl} 
              title="PDF preview" 
              width="100%" 
              height="500px" 
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
      
      {/* Render fullscreen modal */}
      {renderFullscreen()}
    </>
  );
};

export default MediaPreview;