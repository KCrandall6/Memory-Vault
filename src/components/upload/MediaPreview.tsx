// src/components/upload/MediaPreview.tsx - with expand and zoom
import { useState, useEffect, useRef } from 'react';
import { Card, Spinner, Modal, Button } from 'react-bootstrap';
import { SelectedUploadFile } from '../../types/upload';

interface MediaPreviewProps {
  file: SelectedUploadFile | null;
}

const MediaPreview = ({ file }: MediaPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // For expand and zoom features
  const [showFullscreen, setShowFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    setPreviewUrl('');
    setFileType('');
    setZoomLevel(1);
    setShowFullscreen(false);

    if (!file) {
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    if (file instanceof Blob) {
      setFileType(file.type || '');
      objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsLoading(false);
    } else if (file.path) {
      if (window.electronAPI?.getFilePreview) {
        window.electronAPI.getFilePreview(file.path)
          .then(result => {
            if (cancelled) return;
            if (result) {
              setPreviewUrl(result.dataUrl);
              setFileType(result.mimeType);
            } else {
              setError('Could not generate preview');
            }
            setIsLoading(false);
          })
          .catch((err: Error) => {
            if (cancelled) return;
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
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
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
    if (!file) return 'Unknown file';
    if ('name' in file && file.name) return file.name;
    if ('path' in file && file.path) {
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
                  <p className="small">File path: {'path' in file ? file.path : 'N/A'}</p>
                  <p className="small">File type: {file.type || 'N/A'}</p>
                  <p className="small">File size: {'size' in file && file.size ? `${Math.round(file.size / 1024)} KB` : 'N/A'}</p>
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
                  transition: 'transform 0.2s ease'
                }}
                onError={() => {
                  console.error('Image failed to load:', previewUrl.substring(0, 100) + '...');
                  setError('Failed to load image preview');
                }}
              />
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
                  <p className="small">File path: {'path' in file ? file.path : 'N/A'}</p>
                  <p className="small">File type: {file.type || 'N/A'}</p>
                  <p className="small">File size: {'size' in file && file.size ? `${Math.round(file.size / 1024)} KB` : 'N/A'}</p>
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
