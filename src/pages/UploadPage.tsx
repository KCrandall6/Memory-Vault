// src/pages/UploadPage.tsx
import { useState, useEffect } from 'react';
import { Alert, Container, Row, Col, Card } from 'react-bootstrap';
import FileSelector from '../components/upload/FileSelector';
import UploadQueue from '../components/upload/UploadQueue';
import MediaPreview from '../components/upload/MediaPreview';
import MetadataForm, {
  MetadataDraft,
  MetadataSubmitPayload
} from '../components/upload/MetadataForm';

// Define interfaces for your data structures
interface MediaType {
  id: number;
  name: string;
}

interface Collection {
  id: number;
  name: string;
  description?: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Person {
  id: number;
  name: string;
}

const UploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [existingPeople, setExistingPeople] = useState<Person[]>([]);
  const [metadataDrafts, setMetadataDrafts] = useState<Record<string, MetadataDraft>>({});
  const [statusMessage, setStatusMessage] = useState<
    { variant: 'success' | 'danger'; text: string } | null
  >(null);

  const getFileKey = (file: File) => {
    const maybePath = (file as File & { path?: string }).path;
    if (typeof maybePath === 'string' && maybePath.length > 0) {
      return maybePath;
    }
    return `${file.name}-${file.lastModified}-${file.size}`;
  };

  // Fetch reference data from database
  useEffect(() => {
    let isMounted = true;

    const fetchReferenceData = async () => {
      try {
        const fallbackMediaTypes: MediaType[] = [
          { id: 1, name: 'Image' },
          { id: 2, name: 'Video' },
          { id: 3, name: 'Document' },
          { id: 4, name: 'Audio' }
        ];

        const mediaTypesFromDb = await window.electronAPI
          .getMediaTypes()
          .catch((err: unknown) => {
            console.warn('Error fetching media types:', err);
            return [] as MediaType[];
          });

        const mediaTypesList =
          mediaTypesFromDb && mediaTypesFromDb.length > 0
            ? mediaTypesFromDb
            : fallbackMediaTypes;

        const collectionsList = await window.electronAPI
          .getCollections()
          .catch((err: unknown) => {
            console.warn('Error fetching collections:', err);
            return [] as Collection[];
          });

        const tagsListFromDb = await window.electronAPI
          .getTags()
          .catch((err: unknown) => {
            console.warn('Error fetching tags:', err);
            return [] as Tag[];
          });

        const tagsList =
          tagsListFromDb && tagsListFromDb.length > 0
            ? tagsListFromDb
            : [
                { id: 1, name: 'family' },
                { id: 2, name: 'vacation' },
                { id: 3, name: 'birthday' }
              ];

        const peopleListFromDb = await window.electronAPI
          .getPeople()
          .catch((err: unknown) => {
            console.warn('Error fetching people:', err);
            return [] as Person[];
          });

        const peopleList =
          peopleListFromDb && peopleListFromDb.length > 0
            ? peopleListFromDb
            : [
                { id: 1, name: 'John Smith' },
                { id: 2, name: 'Jane Smith' },
                { id: 3, name: 'Alex Johnson' }
              ];

        if (!isMounted) {
          return;
        }

        setMediaTypes(mediaTypesList);
        setCollections(collectionsList);
        setExistingTags(tagsList);
        setExistingPeople(peopleList);
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    void fetchReferenceData();

    return () => {
      isMounted = false;
    };
  }, []);
  
  useEffect(() => {
    if (!statusMessage) return;
    const timeout = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);


  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files);
    if (!files || files.length === 0) return;

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
  const handleSaveMetadata = async (metadata: MetadataSubmitPayload) => {
    try {
      const fileWithPath = metadata.file as File & { path?: string };
      if (!fileWithPath.path) {
        throw new Error('File path missing from selected file');
      }
      // Prepare data for saving
      const data = {
        filePath: fileWithPath.path, // This is the full path from Electron's file dialog
        metadata: {
          title: metadata.title,
          description: metadata.description,
          mediaTypeId: metadata.mediaTypeId,
          captureDate: metadata.captureDate,
          location: metadata.location,
          collectionId: metadata.collectionId,
          collection: metadata.collection ?? null,
          tags: metadata.tags,
          people: metadata.people
        }
      };
      
      console.log('Saving media data:', data);
      
      // Send to Electron main process via IPC
      const result = await window.electronAPI.saveMedia(data);
      
      if (result.success) {
        // Remove the saved file from the queue
        const newSelectedFiles = selectedFiles.filter(f => f !== metadata.file);
        setSelectedFiles(newSelectedFiles);

        if (metadata.file) {
          const key = getFileKey(metadata.file);
          setMetadataDrafts(prev => {
            const nextDrafts = { ...prev };
            delete nextDrafts[key];
            return nextDrafts;
          });
        }

        // Select the next file or clear
        if (newSelectedFiles.length > 0) {
          setCurrentFile(newSelectedFiles[0]);
        } else {
          setCurrentFile(null);
        }

        setStatusMessage({
          variant: 'success',
          text: `${metadata.file.name} saved successfully!`
        });
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatusMessage({
        variant: 'danger',
        text: `Error saving file: ${errorMessage}`
      });
    }
  };

  const handleDraftChange = (file: File, draft: MetadataDraft) => {
    const key = getFileKey(file);
    setMetadataDrafts(prev => ({
      ...prev,
      [key]: draft
    }));
  };

  const currentDraft = currentFile ? metadataDrafts[getFileKey(currentFile)] : undefined;
  
  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Upload & Index Media</h1>

      {statusMessage && (
        <Alert
          variant={statusMessage.variant}
          onClose={() => setStatusMessage(null)}
          dismissible
          className="mb-4"
        >
          {statusMessage.text}
        </Alert>
      )}
      
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
                  key={currentFile ? getFileKey(currentFile) : 'no-file'}
                  file={currentFile}
                  onSave={handleSaveMetadata}
                  mediaTypes={mediaTypes}
                  collections={collections}
                  existingTags={existingTags}
                  existingPeople={existingPeople}
                  draft={currentDraft}
                  onDraftChange={draft => {
                    if (!currentFile) return;
                    handleDraftChange(currentFile, draft);
                  }}
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