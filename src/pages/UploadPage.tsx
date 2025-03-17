// src/pages/UploadPage.tsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import FileSelector from '../components/upload/FileSelector';
import UploadQueue from '../components/upload/UploadQueue';
import MediaPreview from '../components/upload/MediaPreview';
import MetadataForm from '../components/upload/MetadataForm';

const UploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [sourceTypes, setSourceTypes] = useState([]);
  const [collections, setCollections] = useState([]);
  
  // Fetch reference data from database
  useEffect(() => {
    // In a real implementation, these would come from your database via IPC
    // For now, we'll use placeholder data
    setMediaTypes([
      { id: 1, name: 'Image' },
      { id: 2, name: 'Video' },
      { id: 3, name: 'Document' },
      { id: 4, name: 'Audio' }
    ]);
    
    setSourceTypes([
      { id: 1, name: 'Digital Camera' },
      { id: 2, name: 'Phone' },
      { id: 3, name: 'Scanned Photo' },
      { id: 4, name: 'Scanned Document' }
    ]);
    
    setCollections([
      { id: 1, name: 'Family Vacation 2023' },
      { id: 2, name: 'Wedding Anniversary' },
      { id: 3, name: 'Birthday Party' }
    ]);
  }, []);
  
  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    if (!currentFile && files.length > 0) {
      setCurrentFile(files[0]);
    }
  };
  
  // Handle selecting a file from the queue
  const handleFileSelect = (file: File) => {
    setCurrentFile(file);
  };
  
  // Handle saving metadata
  const handleSaveMetadata = async (metadata: any) => {
    try {
      // In a real implementation, this would:
      // 1. Use Electron IPC to communicate with main process
      // 2. Copy the file to your media storage location
      // 3. Save metadata to the SQLite database
      console.log('Saving file:', metadata.file.name);
      console.log('Metadata:', metadata);
      
      // Remove the saved file from the queue
      const newSelectedFiles = selectedFiles.filter(f => f !== metadata.file);
      setSelectedFiles(newSelectedFiles);
      
      // Select the next file or clear
      if (newSelectedFiles.length > 0) {
        setCurrentFile(newSelectedFiles[0]);
      } else {
        setCurrentFile(null);
      }
      
      // Show success message
      alert(`${metadata.file.name} saved successfully!`);
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Error saving file. Please try again.');
    }
  };
  
  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Upload & Index Media</h1>
      
      {selectedFiles.length === 0 ? (
        // Initial state: just the file selector
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <FileSelector 
              onFilesSelected={handleFilesSelected}
              hasFiles={selectedFiles.length > 0}
            />
          </Col>
        </Row>
      ) : (
        // After files are selected: show the full interface
        <Row>
          {/* Left sidebar: Queue and file selector */}
          <Col md={3}>
            <Card className="mb-3">
              <Card.Header>
                <h5 className="mb-0">Upload Queue</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <UploadQueue 
                  files={selectedFiles}
                  currentFile={currentFile}
                  onFileSelect={handleFileSelect}
                />
              </Card.Body>
            </Card>
            
            <FileSelector 
              onFilesSelected={handleFilesSelected}
              hasFiles={selectedFiles.length > 0}
            />
          </Col>
          
          {/* Center: Preview */}
          <Col md={5}>
            <MediaPreview file={currentFile} />
          </Col>
          
          {/* Right sidebar: Metadata form */}
          <Col md={4}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Media Information</h5>
              </Card.Header>
              <Card.Body>
                <MetadataForm 
                  file={currentFile}
                  onSave={handleSaveMetadata}
                  mediaTypes={mediaTypes}
                  sourceTypes={sourceTypes}
                  collections={collections}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default UploadPage;