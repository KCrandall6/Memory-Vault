import { FormEvent, useEffect, useState } from 'react';
import { Button, Form, Modal, Row, Col } from 'react-bootstrap';
import { DetailedMedia } from './DetailsModal';

export type EditableDetails = Pick<
  DetailedMedia,
  'title' | 'description' | 'captureDate' | 'location' | 'collection' | 'tags' | 'people'
>;

type EditDetailsModalProps = {
  show: boolean;
  media: DetailedMedia;
  onClose: () => void;
  onSave: (details: EditableDetails) => void;
};

const EditDetailsModal = ({ show, media, onClose, onSave }: EditDetailsModalProps) => {
  const [formState, setFormState] = useState<EditableDetails>({
    title: media.title,
    description: media.description || '',
    captureDate: media.captureDate || '',
    location: media.location || '',
    collection: media.collection || '',
    tags: media.tags || [],
    people: media.people || [],
  });

  useEffect(() => {
    setFormState({
      title: media.title,
      description: media.description || '',
      captureDate: media.captureDate || '',
      location: media.location || '',
      collection: media.collection || '',
      tags: media.tags || [],
      people: media.people || [],
    });
  }, [media]);

  const handleChange = (field: keyof EditableDetails, value: string | string[]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formState);
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit details</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="title">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={formState.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="collection">
                <Form.Label>Collection</Form.Label>
                <Form.Control
                  type="text"
                  value={formState.collection || ''}
                  onChange={(e) => handleChange('collection', e.target.value)}
                  placeholder="e.g., Family, Vacations"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mt-1">
            <Col md={6}>
              <Form.Group controlId="captureDate">
                <Form.Label>Capture date</Form.Label>
                <Form.Control
                  type="date"
                  value={formState.captureDate || ''}
                  onChange={(e) => handleChange('captureDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="location">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  value={formState.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="City, venue, or description"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="description" className="mt-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formState.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Form.Group>

          <Row className="g-3 mt-1">
            <Col md={6}>
              <Form.Group controlId="people">
                <Form.Label>People (comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  value={(formState.people || []).join(', ')}
                  onChange={(e) => handleChange('people', e.target.value.split(',').map((p) => p.trim()).filter(Boolean))}
                  placeholder="e.g., Alice, Bob"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="tags">
                <Form.Label>Tags (comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  value={(formState.tags || []).join(', ')}
                  onChange={(e) => handleChange('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                  placeholder="e.g., travel, family"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save changes
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditDetailsModal;