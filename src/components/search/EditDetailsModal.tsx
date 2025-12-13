import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Form, Modal, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import { DetailedMedia } from './DetailsModal';
import { ReferenceOption } from './SearchBar';

export type EditableDetails = Pick<
  DetailedMedia,
  'title' | 'description' | 'captureDate' | 'location' | 'collection' | 'tags' | 'people'
>;

type EditDetailsModalProps = {
  show: boolean;
  media: DetailedMedia;
  onClose: () => void;
  onSave: (details: EditableDetails) => void;
  availableCollections: ReferenceOption[];
  availablePeople: ReferenceOption[];
  availableTags: ReferenceOption[];
};

const EditDetailsModal = ({
  show,
  media,
  onClose,
  onSave,
  availableCollections,
  availablePeople,
  availableTags,
}: EditDetailsModalProps) => {
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

  const [collectionSearch, setCollectionSearch] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [tagsSearch, setTagsSearch] = useState('');
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');

  useEffect(() => {
    setCollectionSearch('');
    setPeopleSearch('');
    setTagsSearch('');
    setNewCollectionName('');
    setNewCollectionDescription('');
    setShowCollectionModal(false);
  }, [media]);

  const filteredCollections = useMemo(() => {
    if (!collectionSearch) return availableCollections;
    const term = collectionSearch.toLowerCase();
    return availableCollections
      .filter((item) => item.name.toLowerCase().includes(term))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(term)) - Number(a.name.toLowerCase().startsWith(term)));
  }, [availableCollections, collectionSearch]);

  const filteredPeople = useMemo(() => {
    if (!peopleSearch) return availablePeople;
    const term = peopleSearch.toLowerCase();
    return availablePeople
      .filter((person) => person.name.toLowerCase().includes(term))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(term)) - Number(a.name.toLowerCase().startsWith(term)));
  }, [availablePeople, peopleSearch]);

  const filteredTags = useMemo(() => {
    if (!tagsSearch) return availableTags;
    const term = tagsSearch.toLowerCase();
    return availableTags
      .filter((tag) => tag.name.toLowerCase().includes(term))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(term)) - Number(a.name.toLowerCase().startsWith(term)));
  }, [availableTags, tagsSearch]);

  const handleChange = (field: keyof EditableDetails, value: string | string[]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formState);
  };

  const addNewCollection = () => {
    const trimmed = (collectionSearch || newCollectionName).trim();
    if (!trimmed) return;
    handleChange('collection', trimmed);
    setCollectionSearch('');
    setNewCollectionName('');
    setNewCollectionDescription('');
    setShowCollectionModal(false);
  };

  const addPerson = (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    setFormState((prev) => ({
      ...prev,
      people: Array.from(new Set([...(prev.people || []), normalized])),
    }));
    setPeopleSearch('');
  };

  const removePerson = (name: string) => {
    setFormState((prev) => ({
      ...prev,
      people: (prev.people || []).filter((p) => p !== name),
    }));
  };

  const addTag = (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    setFormState((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev.tags || []), normalized])),
    }));
    setTagsSearch('');
  };

  const removeTag = (name: string) => {
    setFormState((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== name),
    }));
  };

 return (
    <>
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
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={collectionSearch}
                      onChange={(e) => setCollectionSearch(e.target.value)}
                      placeholder="Search or create collection"
                    />
                    <Button
                      variant="outline-secondary"
                      className="accent-outline-btn"
                      onClick={() => setShowCollectionModal(true)}
                    >
                      + New
                    </Button>
                  </InputGroup>
                  <div className="border rounded p-2 mt-1" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {filteredCollections.length > 0 ? (
                      filteredCollections.map((collection) => (
                        <div
                          key={collection.id}
                          role="button"
                          className="py-1 px-2 rounded"
                          onClick={() => {
                            handleChange('collection', collection.name);
                            setCollectionSearch('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleChange('collection', collection.name);
                              setCollectionSearch('');
                            }
                          }}
                          tabIndex={0}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {collection.name}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted small">No matches</div>
                    )}
                    {collectionSearch.trim() && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="mt-2 w-100 accent-outline-btn"
                        onClick={() => addNewCollection()}
                      >
                        <i className="bi bi-plus"></i> Create "{collectionSearch.trim()}"
                      </Button>
                    )}
                    {formState.collection && !collectionSearch && (
                      <div className="mt-2">
                        <Badge bg="light" text="dark" className="me-2">{formState.collection}</Badge>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleChange('collection', '')}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
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
                  <Form.Label>People</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={peopleSearch}
                      onChange={(e) => setPeopleSearch(e.target.value)}
                      placeholder="Search or add people"
                    />
                    <Button
                      variant="outline-secondary"
                      className="accent-outline-btn"
                      onClick={() => addPerson(peopleSearch)}
                      disabled={!peopleSearch.trim()}
                    >
                      Add
                    </Button>
                  </InputGroup>
                  <div className="border rounded p-2 mt-1" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {(formState.people || []).length > 0 && (
                      <div className="mb-2 d-flex flex-wrap gap-2">
                        {formState.people?.map((person) => (
                          <Badge key={person} bg="light" text="primary" className="border">
                            {person}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-1 text-decoration-none"
                              onClick={() => removePerson(person)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {filteredPeople.length > 0 ? (
                      filteredPeople
                        .filter((person) => !(formState.people || []).includes(person.name))
                        .map((person) => (
                          <div
                            key={person.id}
                            role="button"
                            className="py-1 px-2 rounded"
                            tabIndex={0}
                            onClick={() => addPerson(person.name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addPerson(person.name);
                            }}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {person.name}
                          </div>
                        ))
                    ) : (
                      <div className="text-muted small">No matches</div>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="tags">
                  <Form.Label>Tags</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={tagsSearch}
                      onChange={(e) => setTagsSearch(e.target.value)}
                      placeholder="Search or add tags"
                    />
                    <Button
                      variant="outline-secondary"
                      className="accent-outline-btn"
                      onClick={() => addTag(tagsSearch)}
                      disabled={!tagsSearch.trim()}
                    >
                      Add
                    </Button>
                  </InputGroup>
                  <div className="border rounded p-2 mt-1" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {(formState.tags || []).length > 0 && (
                      <div className="mb-2 d-flex flex-wrap gap-2">
                        {formState.tags?.map((tag) => (
                          <Badge key={tag} bg="light" text="secondary" className="border">
                            #{tag}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-1 text-decoration-none"
                              onClick={() => removeTag(tag)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {filteredTags.length > 0 ? (
                      filteredTags
                        .filter((tag) => !(formState.tags || []).includes(tag.name))
                        .map((tag) => (
                          <div
                            key={tag.id}
                            role="button"
                            className="py-1 px-2 rounded"
                            tabIndex={0}
                            onClick={() => addTag(tag.name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addTag(tag.name);
                            }}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {tag.name}
                          </div>
                        ))
                    ) : (
                      <div className="text-muted small">No matches</div>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
            >
              Save changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showCollectionModal} onHide={() => setShowCollectionModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>New collection</Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            addNewCollection();
          }}
        >
          <Modal.Body>
            <Form.Group controlId="newCollectionName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Family Trip"
                required
              />
            </Form.Group>
            <Form.Group controlId="newCollectionDescription" className="mt-3">
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Summer vacation, Sweden 2024"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCollectionModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              disabled={!newCollectionName.trim()}
              style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
            >
              Save collection
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default EditDetailsModal;
