// src/components/upload/FileSelector.tsx

import { Button, Card } from 'react-bootstrap';

interface FileSelectorProps {
  onFilesSelected: (files: File[]) => void;
  hasFiles: boolean;
}

const FileSelector = ({ onFilesSelected, hasFiles }: FileSelectorProps) => {
  const handleSelectFiles = async () => {
    try {
      // Use Electron's file dialog instead of browser input
      const fileInfos = await window.electronAPI.selectFiles();
      
      if (fileInfos && fileInfos.length > 0) {
        // Convert file info to File objects
        // Note: This is a simplified approach. In a real implementation,
        // you might need to handle the file differently since you can't create
        // actual File objects from paths in the renderer process
        const files = fileInfos.map((fileInfo) => {
          // Create a pseudo File object with necessary properties
          return {
            name: fileInfo.name,
            path: fileInfo.path,
            size: fileInfo.size,
            type: getFileType(fileInfo.type),
            lastModified: fileInfo.lastModified
          };
        });
        
        onFilesSelected(files);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      alert('Error selecting files. Please try again.');
    }
  };
  
  // Helper function to guess mime type from extension
  const getFileType = (ext) => {
    const extMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4'
    };
    
    return extMap[ext.toLowerCase()] || 'application/octet-stream';
  };

  return (
    <Card className="text-center p-5">
      <Card.Body>
        {!hasFiles ? (
          <>
            <div className="mb-4">
              <i className="bi bi-cloud-arrow-up" style={{ 
                fontSize: '4rem', 
                color: '#1E3A5F',
                opacity: 0.7 
              }}></i>
            </div>
            <h3 className="mb-4">Start Indexing Your Memories</h3>
            <p className="text-muted mb-4">
              Select photos, documents, or other media files to begin preserving your memories
            </p>
          </>
        ) : (
          <h5 className="mb-4">Add More Files</h5>
        )}
        
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSelectFiles}
          className="px-4"
          style={{ backgroundColor: '#FFB800', borderColor: '#FFB800'}}
        >
          {hasFiles ? 'Select More Files' : 'Select Files'}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default FileSelector;