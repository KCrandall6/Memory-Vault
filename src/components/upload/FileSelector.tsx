// src/components/upload/FileSelector.tsx
import { Button, Card } from 'react-bootstrap';

interface FileSelectorProps {
  onFilesSelected: (files: File[]) => void;
  hasFiles: boolean;
}

const FileSelector = ({ onFilesSelected, hasFiles }: FileSelectorProps) => {
  const handleSelectFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        onFilesSelected(files);
      }
    };
    
    input.click();
  };

  return (
    <Card className="text-center p-5">
      <Card.Body>
        {!hasFiles ? (
          <>
            <div className="mb-4">
              {/* Bootstrap icon instead of external SVG */}
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