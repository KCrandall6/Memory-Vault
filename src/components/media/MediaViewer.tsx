// src/components/media/MediaViewer.tsx
import { useState, useEffect } from 'react';
import { Card, Button, Modal, Spinner } from 'react-bootstrap';
// Replace with standard Bootstrap icons
import { 
  ArrowsFullscreen, 
  FullscreenExit, 
  ZoomIn, 
  ZoomOut 
} from 'react-bootstrap-icons';

interface MediaViewerProps {
  media: {
    id: number;
    file_path: string;
    title: string;
    description: string;
    media_type: string;
  } | null;
  thumbnail?: string;
}

const MediaViewer = ({ media, thumbnail }: MediaViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset zoom level when media changes
    setZoomLevel(1);
    setError(null);
  }, [media]);

  if (!media) {
    return (
      <Card className="media-viewer">
        <Card.Body className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <p className="text-muted">No media selected</p>
        </Card.Body>
      </Card>
    );
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Helper to determine what type of media we're dealing with
  const isImage = media.media_type?.toLowerCase() === 'image';
  const isVideo = media.media_type?.toLowerCase() === 'video';
  const isAudio = media.media_type?.toLowerCase() === 'audio';
  const isPdf = media.file_path.toLowerCase().endsWith('.pdf');

  // Render the appropriate media element
  const renderMedia = () => {
    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center h-100">
          <Spinner animation="border" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="d-flex justify-content-center align-items-center h-100">
          <p className="text-danger">{error}</p>
        </div>
      );
    }

    if (isImage) {
      return (
        <div 
          className="d-flex justify-content-center align-items-center overflow-auto"
          style={{ height: isFullscreen ? '85vh' : '350px' }}
        >
          <img 
            src={thumbnail || media.file_path} 
            alt={media.title}
            style={{ 
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s ease-in-out',
              transformOrigin: 'center center'
            }}
            onError={() => setError('Error loading image')}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div 
          className="d-flex justify-content-center align-items-center"
          style={{ height: isFullscreen ? '85vh' : '350px' }}
        >
          <video 
            src={media.file_path} 
            controls
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              width: isFullscreen ? 'auto' : '100%'
            }}
            onError={() => setError('Error loading video')}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div 
          className="d-flex justify-content-center align-items-center flex-column"
          style={{ height: isFullscreen ? '85vh' : '350px' }}
        >
          <div className="mb-3" style={{ fontSize: '5rem' }}>
            🎵
          </div>
          <audio 
            src={media.file_path} 
            controls
            style={{ width: '100%', maxWidth: '500px' }}
            onError={() => setError('Error loading audio')}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div 
          style={{ height: isFullscreen ? '85vh' : '350px' }}
        >
          <iframe 
            src={media.file_path}
            title={media.title}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            onError={() => setError('Error loading PDF')}
          />
        </div>
      );
    }

    // Default view for other file types
    return (
      <div 
        className="d-flex justify-content-center align-items-center flex-column"
        style={{ height: isFullscreen ? '85vh' : '350px' }}
      >
        <div className="mb-3" style={{ fontSize: '5rem' }}>
          {isImage ? '📷' : isVideo ? '🎥' : isAudio ? '🎵' : isPdf ? '📑' : '📄'}
        </div>
        <p className="text-muted">
          {media.media_type || 'Unknown'} file
        </p>
        <p className="text-muted">
          {media.file_path.split('/').pop()}
        </p>
      </div>
    );
  };

  // Render controls appropriate for the media type
  const renderControls = () => {
    return (
      <div className="d-flex justify-content-end">
        {isImage && (
          <>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-2"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut />
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-2"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
            >
              <ZoomIn />
            </Button>
          </>
        )}
        <Button 
          variant="outline-secondary" 
          size="sm"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <FullscreenExit /> : <ArrowsFullscreen />}
        </Button>
      </div>
    );
  };

  // If in fullscreen mode, render in a modal
  if (isFullscreen) {
    return (
      <>
        <Card className="media-viewer">
          <Card.Body className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <p className="text-muted">(Fullscreen view open)</p>
          </Card.Body>
        </Card>

        <Modal 
          show={isFullscreen} 
          onHide={() => setIsFullscreen(false)}
          fullscreen
          dialogClassName="media-fullscreen-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>{media.title}</Modal.Title>
            <div className="ms-auto">
              {renderControls()}
            </div>
          </Modal.Header>
          <Modal.Body className="p-0 d-flex justify-content-center align-items-center">
            {renderMedia()}
          </Modal.Body>
          {media.description && (
            <Modal.Footer>
              <div>{media.description}</div>
            </Modal.Footer>
          )}
        </Modal>
      </>
    );
  }

  // Regular view
  return (
    <Card className="media-viewer">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{media.title}</h5>
        {renderControls()}
      </Card.Header>
      <Card.Body className="p-0">
        {renderMedia()}
      </Card.Body>
      {media.description && (
        <Card.Footer>
          <small>{media.description}</small>
        </Card.Footer>
      )}
    </Card>
  );
};

export default MediaViewer;