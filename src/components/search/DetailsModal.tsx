import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import ConfirmationModal from '../common/ConfirmationModal';
import { isRendererSafePreviewUrl } from '../recent/recentMedia';
import EditDetailsModal, { EditableDetails } from './EditDetailsModal';
import { ReferenceOption } from './SearchBar';

export type MemoryNote = {
  id: number;
  media_id: number;
  author_name?: string | null;
  content: string;
  created_at: string;
};

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
  mediaTypeId?: number;
  thumbnail?: string;
  filePath?: string;
  fileUrl?: string;
  memoryNotes?: MemoryNote[];
};

type DetailsModalProps = {
  show: boolean;
  media?: DetailedMedia;
  onClose: () => void;
  onSaveDetails: (updated: DetailedMedia) => void;
  onDeleteDetails?: (media: DetailedMedia) => Promise<void> | void;
  availableMediaTypes: ReferenceOption[];
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
  onDeleteDetails,
  availableMediaTypes,
  availableCollections,
  availablePeople,
  availableTags,
}: DetailsModalProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteAuthorName, setNoteAuthorName] = useState('');
  const [lastAuthorName, setLastAuthorName] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [memoryNotes, setMemoryNotes] = useState<MemoryNote[]>([]);

  const previewSource = useMemo(() => {
    if (!media || previewFailed) return undefined;
    if (media.thumbnail && isRendererSafePreviewUrl(media.thumbnail)) return media.thumbnail;
    if (media.fileUrl && isRendererSafePreviewUrl(media.fileUrl)) return media.fileUrl;
    return undefined;
  }, [media, previewFailed]);

  const handleImageError = () => setPreviewFailed(true);

  const handleSave = (details: EditableDetails) => {
    if (!media) return;
    const updated: DetailedMedia = {
      ...media,
      ...details,
      tags: details.tags,
      people: details.people,
      mediaType: details.mediaType,
      mediaTypeId: details.mediaTypeId,
    };
    onSaveDetails(updated);
    setEditing(false);
  };

  const handleDownload = async () => {
    if (!media || (!media.filePath && !media.fileUrl)) return;
    const sourcePath = media.filePath || media.fileUrl || '';
    if (!sourcePath) return;
    try {
      await window.electronAPI.downloadMediaFile({
        filePath: sourcePath,
        defaultFileName: media.title || 'memory'
      });
    } catch (error) {
      console.error('Error downloading media', error);
    }
  };


  const handleConfirmDelete = async () => {
    if (!media || !onDeleteDetails) return;
    setDeleting(true);
    try {
      await onDeleteDetails(media);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };


  const formatNoteDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(parsed);
  };

  const openAddNoteModal = () => {
    setNoteAuthorName(lastAuthorName);
    setNoteContent('');
    setNoteError(null);
    setShowAddNote(true);
  };

  const handleSaveNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!media || !noteContent.trim()) return;

    setSavingNote(true);
    setNoteError(null);
    try {
      const response = await window.electronAPI.addMemoryNote(Number(media.id), {
        authorName: noteAuthorName,
        content: noteContent
      });

      if (!response.success || !response.note) {
        throw new Error(response.error || 'The note could not be saved.');
      }

      const savedNote = response.note;

      if (noteAuthorName.trim()) {
        setLastAuthorName(noteAuthorName.trim());
      }
      setMemoryNotes((prev) => [...prev, savedNote]);
      setShowAddNote(false);
      setNoteContent('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The note could not be saved.';
      setNoteError(message);
    } finally {
      setSavingNote(false);
    }
  };

  const icon = media ? mediaTypeIcon[media.mediaType] ?? 'bi-file-earmark' : 'bi-file-earmark';

  const mediaTypeLabel = media?.mediaType
    ? media.mediaType.charAt(0).toUpperCase() + media.mediaType.slice(1)
    : '';

  useEffect(() => {
    setPreviewFailed(false);
    setMemoryNotes(media?.memoryNotes || []);
    setShowAddNote(false);
    setNoteContent('');
    setNoteError(null);
  }, [media?.id, media?.thumbnail, media?.fileUrl, media?.memoryNotes]);

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
                <div className="bg-white rounded-3 p-3 shadow-sm h-100 d-flex flex-column">
                  <div className="flex-grow-1 d-flex justify-content-center align-items-center">
                    {previewSource ? (
                      <img
                        src={previewSource}
                        alt={media.title}
                        className="img-fluid rounded"
                        style={{ maxHeight: '70vh', objectFit: 'contain' }}
                        onError={handleImageError}
                      />
                    ) : (
                      <i className={`bi ${icon} display-4 text-muted`}></i>
                    )}
                  </div>
                  <div className="d-flex flex-wrap gap-2 justify-content-center border-top mt-3 pt-3">
                    <Button variant="outline-secondary" size="sm" onClick={() => setShowPreview(true)}>
                      View full screen
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
                      onClick={handleDownload}
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
                            <span className="fw-semibold">Date Uploaded:</span> {media.uploadDate}
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
                      <div className="fw-semibold">Date</div>
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
                          <Badge key={person} bg="light" text="primary" className="people-chip">
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


                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="fw-semibold">Memory Notes</div>
                      <Button variant="outline-secondary" size="sm" onClick={openAddNoteModal}>
                        Add Note
                      </Button>
                    </div>
                    {memoryNotes.length > 0 ? (
                      <div className="d-flex flex-column gap-2 mt-2">
                        {memoryNotes.map((note) => (
                          <div key={note.id} className="bg-light border rounded p-3">
                            <div className="text-muted small mb-1">
                              {note.author_name ? `${note.author_name} · ` : ''}{formatNoteDate(note.created_at)}
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{note.content}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted mt-2">No notes yet.</div>
                    )}
                  </div>

                  {onDeleteDetails && (
                    <div className="mt-auto pt-4 border-top d-flex justify-content-end">
                      <Button variant="outline-danger" size="sm" onClick={() => setConfirmDelete(true)}>
                        Delete memory
                      </Button>
                    </div>
                  )}
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
              onError={handleImageError}
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


      <Modal show={showAddNote} onHide={() => setShowAddNote(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Memory Note</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveNote}>
          <Modal.Body>
            <Form.Group controlId="memoryNoteAuthor">
              <Form.Label>Your name</Form.Label>
              <Form.Control
                type="text"
                value={noteAuthorName}
                onChange={(event) => setNoteAuthorName(event.target.value)}
                placeholder="Optional"
              />
            </Form.Group>
            <Form.Group controlId="memoryNoteContent" className="mt-3">
              <Form.Label>Note</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                required
              />
            </Form.Group>
            {noteError && <div className="text-danger small mt-2">{noteError}</div>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddNote(false)} disabled={savingNote}>
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              disabled={savingNote || !noteContent.trim()}
              style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
            >
              {savingNote ? 'Saving…' : 'Save Note'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {media && (
        <ConfirmationModal
          show={confirmDelete}
          title="Delete memory?"
          message="This removes the memory from the vault index and cleans up people/tag links. The archived file will not be deleted from disk."
          cancelLabel="Keep memory"
          confirmLabel="Delete memory"
          destructive
          confirming={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {media && (
        <EditDetailsModal
          show={editing}
          media={media}
          onClose={() => setEditing(false)}
          onSave={handleSave}
          availableMediaTypes={availableMediaTypes}
          availableCollections={availableCollections}
          availablePeople={availablePeople}
          availableTags={availableTags}
        />
      )}
    </>
  );
};

export default DetailsModal;