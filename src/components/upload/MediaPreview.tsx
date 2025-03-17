// src/components/upload/MediaPreview.tsx
import { useState, useEffect } from 'react';
import { Card, Button, Modal } from 'react-bootstrap';
import './MediaPreview.css';

interface MediaPreviewProps {
  file: File | null;
}

const MediaPreview = ({ file }: MediaPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (file) {
      setFileType(file.type);
      
      // Clean up previous URLs
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPdfPreviewUrl('');
      } else if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        setPdfPreviewUrl(url);
        setPreviewUrl('');
      } else {
        setPreviewUrl('');
        setPdfPreviewUrl('');
      }
      
      // Clean up on unmount
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      };
    }
  }, [file]);

  const handleZoom = () => {
    setShowFullscreen(true);
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

  return (
    <>
      <Card className="preview-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{file.name}</h5>
          {(previewUrl || pdfPreviewUrl) && (
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleZoom}
              className="zoom-button"
            >
              <i className="bi bi-arrows-fullscreen"></i> Zoom
            </Button>
          )}
        </Card.Header>
        <Card.Body className="d-flex justify-content-center align-items-center preview-container">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="img-fluid preview-image" 
            />
          ) : pdfPreviewUrl ? (
            <iframe 
              src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`} 
              title="PDF Preview" 
              className="pdf-preview"
            />
          ) : (
            <div className="text-center">
              <div className="mb-3" style={{ fontSize: '3rem' }}>
                {fileType.startsWith('video/') && '🎥'}
                {fileType.startsWith('audio/') && '🎵'}
                {fileType === 'application/pdf' && '📑'}
                {!fileType.startsWith('video/') && 
                 !fileType.startsWith('audio/') && 
                 fileType !== 'application/pdf' && '📄'}
              </div>
              <p className="text-muted">Preview not available for this file type</p>
              <p className="text-muted small">{file.type}</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Fullscreen Modal */}
      <Modal 
        show={showFullscreen} 
        onHide={() => setShowFullscreen(false)} 
        size="xl" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{file.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {previewUrl ? (
            <div className="text-center p-3">
              <img 
                src={previewUrl} 
                alt="Full Preview" 
                className="img-fluid" 
                style={{ maxHeight: '80vh' }}
              />
            </div>
          ) : pdfPreviewUrl ? (
            <iframe 
              src={pdfPreviewUrl} 
              title="PDF Full Preview" 
              style={{ width: '100%', height: '80vh', border: 'none' }}
            />
          ) : null}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default MediaPreview;