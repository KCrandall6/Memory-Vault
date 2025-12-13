import { useMemo, useState } from 'react';
import { Badge, Button, Col, Modal, Row } from 'react-bootstrap';
import EditDetailsModal, { EditableDetails } from './EditDetailsModal';
import { ReferenceOption } from './SearchBar';

export type DetailedMedia = {
  id: string;
  title: string;
  description?: string;
  captureDate?: string;
  uploadDate?: string;
  location?: string;
  collection?: string;
  tags?: string[];
  people?: string[];
  mediaType: string;
  thumbnail?: string;
};

type DetailsModalProps = {
  show: boolean;
  media?: DetailedMedia;
  onClose: () => void;
  onSaveDetails: (updated: DetailedMedia) => void;
  availableCollections: ReferenceOption[];
  availablePeople: ReferenceOption[];
  availableTags: ReferenceOption[];
};

const mediaTypeIcon: Record<string, string> = {
  image: 'bi-image',
  video: 'bi-camera-video',
  document: 'bi-file-earmark-text',
  audio: 'bi-music-note',
};

const DetailsModal = ({
  show,
  media,
  onClose,
  onSaveDetails,
  availableCollections,
  availablePeople,
  availableTags,
}: DetailsModalProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [editing, setEditing] = useState(false);

  const previewSource = useMemo(() => {
    if (!media) return undefined;
    if (media.thumbnail && media.thumbnail.length > 0) return media.thumbnail;
    return undefined;
  }, [media]);

  const handleSave = (details: EditableDetails) => {
    if (!media) return;
    const updated: DetailedMedia = {
      ...media,
      ...details,
      tags: details.tags,
      people: details.people,
    };
    onSaveDetails(updated);
    setEditing(false);
  };

  const icon = media ? mediaTypeIcon[media.mediaType] ?? 'bi-file-earmark' : 'bi-file-earmark';

  const mediaTypeLabel = media?.mediaType
    ? media.mediaType.charAt(0).toUpperCase() + media.mediaType.slice(1)
    : '';

return (
    <>
      <Modal show={show} onHide={onClose} fullscreen centered>
        <Modal.Header closeButton>
          <Modal.Title>Memory details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          {media ? (
            <Row className="g-4">
              <Col lg={7}>
                <div className="position-relative bg-white rounded-3 p-3 shadow-sm h-100 d-flex justify-content-center align-items-center">
                  {previewSource ? (
                    <img
                      src={previewSource}
                      alt={media.title}
                      className="img-fluid rounded"
                      style={{ maxHeight: '70vh', objectFit: 'contain' }}
                    />
                  ) : (
                    <i className={`bi ${icon} display-4 text-muted`}></i>
                  )}
                  <div className="position-absolute bottom-0 end-0 m-3 d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => setShowPreview(true)}>
                      View full screen
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </Col>
              <Col lg={5}>
                <div className="bg-white rounded-3 p-4 shadow-sm h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="text-muted small">Title</div>
                      <h4 className="mb-2">{media.title}</h4>
                      <div className="text-muted small d-flex flex-wrap gap-3">
                        <span>
                          <span className="fw-semibold">Media Type:</span> {mediaTypeLabel || media.mediaType}
                        </span>
                        {media.uploadDate && (
                          <span>
                            <span className="fw-semibold">Upload Date:</span> {media.uploadDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
                      onClick={() => setEditing(true)}
                    >
                      Edit details
                    </Button>
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold">Description</div>
                    <div className="text-muted">{media.description || '—'}</div>
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <div className="fw-semibold">Capture Date</div>
                      <div className="text-muted">{media.captureDate || '—'}</div>
                    </Col>
                    <Col md={6}>
                      <div className="fw-semibold">Location</div>
                      <div className="text-muted">{media.location || '—'}</div>
                    </Col>
                  </Row>

                  <div className="mt-3">
                    <div className="fw-semibold">Collection</div>
                    <div className="text-muted">{media.collection || '—'}</div>
                  </div>

                  <div className="mt-3">
                    <div className="fw-semibold">People</div>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {media.people && media.people.length > 0 ? (
                        media.people.map((person) => (
                          <Badge key={person} bg="light" text="primary" className="border border-primary">
                            {person}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="fw-semibold">Tags</div>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {media.tags && media.tags.length > 0 ? (
                        media.tags.map((tag) => (
                          <Badge key={tag} bg="light" text="secondary" className="border">
                            #{tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          ) : (
            <div className="text-center text-muted">No media selected.</div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showPreview} onHide={() => setShowPreview(false)} fullscreen>
        <Modal.Body className="bg-black d-flex justify-content-center align-items-center">
          {previewSource ? (
            <img
              src={previewSource}
              alt={media?.title}
              className="img-fluid"
              style={{ maxHeight: '95vh', objectFit: 'contain' }}
            />
          ) : (
            <div className="text-white">No preview available</div>
          )}
          <Button
            variant="light"
            className="position-absolute top-0 end-0 m-3"
            onClick={() => setShowPreview(false)}
          >
            Close
          </Button>
        </Modal.Body>
      </Modal>

      {media && (
        <EditDetailsModal
          show={editing}
          media={media}
          onClose={() => setEditing(false)}
          onSave={handleSave}
          availableCollections={availableCollections}
          availablePeople={availablePeople}
          availableTags={availableTags}
        />
      )}
    </>
  );
};

export default DetailsModal;