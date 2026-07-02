// src/components/upload/UploadQueue.tsx
import { ListGroup, Badge } from 'react-bootstrap';
import { SelectedUploadFile } from '../../types/upload';
import './UploadQueue.css';

interface UploadQueueProps {
  files: SelectedUploadFile[];
  currentFile: SelectedUploadFile | null;
  onFileSelect: (file: SelectedUploadFile) => void;
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
  const getFileTypeIcon = (file: SelectedUploadFile) => {
    const fileType = file.type || '';
    if (fileType.startsWith('image/')) return '📷';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📑';
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
            {formatFileSize('size' in file && file.size ? file.size : 0)}
          </Badge>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default UploadQueue;