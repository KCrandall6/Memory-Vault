// src/components/upload/UploadQueue.tsx
import { ListGroup, Badge } from 'react-bootstrap';
import './UploadQueue.css'; // We'll create this file

interface UploadQueueProps {
  files: File[];
  currentFile: File | null;
  onFileSelect: (file: File) => void;
}

const UploadQueue = ({ files, currentFile, onFileSelect }: UploadQueueProps) => {
  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to get icon based on file type
  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '📷';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.includes('pdf')) return '📑';
    return '📄';
  };

  return (
    <ListGroup className="upload-queue">
      {files.map((file, index) => (
        <ListGroup.Item 
          key={index}
          active={currentFile === file}
          action
          onClick={() => onFileSelect(file)}
          className={`d-flex justify-content-between align-items-center ${currentFile === file ? 'active-item' : ''}`}
        >
          <div className="d-flex align-items-center">
            <span className="me-2">{getFileTypeIcon(file)}</span>
            <div className="text-truncate" style={{ maxWidth: '180px' }}>
              {file.name}
            </div>
          </div>
          <Badge bg="secondary" pill>
            {formatFileSize(file.size)}
          </Badge>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default UploadQueue;