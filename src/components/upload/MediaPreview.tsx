// src/components/upload/MediaPreview.tsx
import { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';

interface MediaPreviewProps {
  file: File | null;
}

const MediaPreview = ({ file }: MediaPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');

  useEffect(() => {
    // Clean up previous URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    if (file) {
      setFileType(file.type || '');
      
      // Only create object URL for browser File objects
      if (file instanceof Blob) {
        try {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        } catch (error) {
          console.error('Error creating object URL:', error);
        }
      } else {
        console.log('Not a standard File/Blob object:', file);
      }
    }
    
    // Cleanup function
    return () => {
      if (previewUrl) {
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

  return (
    <Card className="preview-card">
      <Card.Header>
        <h5 className="mb-0">{file.name}</h5>
      </Card.Header>
      <Card.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="img-fluid" 
            style={{ maxHeight: '300px' }}
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
              {file.type ? 'Preview not available for this file type' : 'File type unknown'}
            </p>
            <p className="text-muted small">{file.type || 'No MIME type available'}</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MediaPreview;