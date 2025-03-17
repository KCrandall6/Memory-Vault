// src/components/upload/MetadataForm.tsx
import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Badge, InputGroup } from 'react-bootstrap';

interface Person {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Collection {
  id: number;
  name: string;
}

interface MetadataFormProps {
  file: File | null;
  onSave: (metadata: any) => void;
  mediaTypes: any[];
  sourceTypes: any[];
  collections: any[];
}

const MetadataForm = ({ file, onSave, mediaTypes, sourceTypes, collections }: MetadataFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    captureDate: '',
    location: '',
    mediaTypeId: '',
    sourceTypeId: '',
    collectionId: '',
    collectionSearchTerm: '',
    newTag: '',
    newPerson: ''
  });
  
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  
  // Dummy data for existing tags and people - in a real app, this would come from the database
  const [existingTags] = useState<Tag[]>([
    { id: 1, name: 'family' },
    { id: 2, name: 'vacation' },
    { id: 3, name: 'birthday' },
    { id: 4, name: 'wedding' },
    { id: 5, name: 'holiday' },
  ]);
  
  const [existingPeople] = useState<Person[]>([
    { id: 1, name: 'John Smith' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Alex Johnson' },
    { id: 4, name: 'Maria Garcia' },
    { id: 5, name: 'David Lee' },
  ]);

  // Reset form when file changes
  useEffect(() => {
    if (file) {
      setFormData({
        title: file.name.split('.')[0], // Default title is filename without extension
        description: '',
        captureDate: '',
        location: '',
        mediaTypeId: determineMediaType(file),
        sourceTypeId: '',
        collectionId: '',
        collectionSearchTerm: '',
        newTag: '',
        newPerson: ''
      });
      setSelectedTags([]);
      setSelectedPeople([]);
    }
  }, [file]);

  // Filter collections based on search term
  useEffect(() => {
    if (formData.collectionSearchTerm.trim() === '') {
      setFilteredCollections(collections);
    } else {
      const filtered = collections.filter(collection => 
        collection.name.toLowerCase().includes(formData.collectionSearchTerm.toLowerCase())
      );
      setFilteredCollections(filtered);
    }
  }, [formData.collectionSearchTerm, collections]);

  // Determine media type from file
  const determineMediaType = (file: File) => {
    if (file.type.startsWith('image/')) return '1'; // Image
    if (file.type.startsWith('video/')) return '2'; // Video
    if (file.type.startsWith('audio/')) return '4'; // Audio
    return '3'; // Document
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add a tag
  const handleAddTag = () => {
    if (formData.newTag.trim() === '') return;
    
    // Check if tag already exists in the selected tags
    const tagExists = selectedTags.some(tag => 
      tag.name.toLowerCase() === formData.newTag.toLowerCase()
    );
    
    if (!tagExists) {
      // Check if tag exists in the existing tags
      const existingTag = existingTags.find(tag => 
        tag.name.toLowerCase() === formData.newTag.toLowerCase()
      );
      
      if (existingTag) {
        setSelectedTags(prev => [...prev, existingTag]);
      } else {
        // Create a new tag with a temporary negative ID (will be replaced with a real ID in the backend)
        const newTag = {
          id: -Math.floor(Math.random() * 1000), // temporary negative ID
          name: formData.newTag.trim()
        };
        setSelectedTags(prev => [...prev, newTag]);
      }
    }
    
    setFormData(prev => ({ ...prev, newTag: '' }));
  };

  // Remove a tag
  const handleRemoveTag = (tagId: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  // Add a person
  const handleAddPerson = () => {
    if (formData.newPerson.trim() === '') return;
    
    // Check if person already exists in the selected people
    const personExists = selectedPeople.some(person => 
      person.name.toLowerCase() === formData.newPerson.toLowerCase()
    );
    
    if (!personExists) {
      // Check if person exists in the existing people
      const existingPerson = existingPeople.find(person => 
        person.name.toLowerCase() === formData.newPerson.toLowerCase()
      );
      
      if (existingPerson) {
        setSelectedPeople(prev => [...prev, existingPerson]);
      } else {
        // Create a new person with a temporary negative ID
        const newPerson = {
          id: -Math.floor(Math.random() * 1000), // temporary negative ID
          name: formData.newPerson.trim()
        };
        setSelectedPeople(prev => [...prev, newPerson]);
      }
    }
    
    setFormData(prev => ({ ...prev, newPerson: '' }));
  };

  // Remove a person
  const handleRemovePerson = (personId: number) => {
    setSelectedPeople(prev => prev.filter(person => person.id !== personId));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: selectedTags,
      people: selectedPeople,
      file
    });
  };

  if (!file) {
    return (
      <div className="text-center text-muted p-4">
        <p>Select a file to add information</p>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Title <span className="text-danger">*</span></Form.Label>
        <Form.Control 
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Description <span className="text-danger">*</span></Form.Label>
        <Form.Control 
          as="textarea"
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </Form.Group>
      
      <Row>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control 
              type="date"
              name="captureDate"
              value={formData.captureDate}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control 
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label>Media Type <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="mediaTypeId"
              value={formData.mediaTypeId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select...</option>
              {mediaTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label>Source Type</Form.Label>
            <Form.Select
              name="sourceTypeId"
              value={formData.sourceTypeId}
              onChange={handleInputChange}
            >
              <option value="">Select...</option>
              {sourceTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      
      <Form.Group className="mb-3">
        <Form.Label>Collection</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search collections..."
            name="collectionSearchTerm"
            value={formData.collectionSearchTerm}
            onChange={handleInputChange}
          />
        </InputGroup>
        {formData.collectionSearchTerm && (
          <div className="border rounded p-2 mt-1" style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {filteredCollections.length > 0 ? (
              filteredCollections.map(collection => (
                <div 
                  key={collection.id} 
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      collectionId: collection.id.toString(),
                      collectionSearchTerm: collection.name
                    }));
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {collection.name}
                </div>
              ))
            ) : (
              <div className="p-2 text-muted">No collections found</div>
            )}
          </div>
        )}
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>People</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Add person..."
            name="newPerson"
            value={formData.newPerson}
            onChange={handleInputChange}
            list="existingPeopleList"
          />
          <datalist id="existingPeopleList">
            {existingPeople.map(person => (
              <option key={person.id} value={person.name} />
            ))}
          </datalist>
          <Button 
            variant="outline-secondary" 
            onClick={handleAddPerson}
          >
            Add
          </Button>
        </InputGroup>
        {selectedPeople.length > 0 && (
          <div className="mt-2">
            {selectedPeople.map(person => (
              <Badge 
                key={person.id} 
                bg="secondary" 
                className="me-1 mb-1 p-2"
                style={{ backgroundColor: '#1E3A5F' }}
              >
                {person.name}
                <span 
                  className="ms-2 cursor-pointer" 
                  onClick={() => handleRemovePerson(person.id)}
                  style={{ cursor: 'pointer' }}
                >
                  ×
                </span>
              </Badge>
            ))}
          </div>
        )}
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Tags</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Add tag..."
            name="newTag"
            value={formData.newTag}
            onChange={handleInputChange}
            list="existingTagsList"
          />
          <datalist id="existingTagsList">
            {existingTags.map(tag => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
          <Button 
            variant="outline-secondary" 
            onClick={handleAddTag}
          >
            Add
          </Button>
        </InputGroup>
        {selectedTags.length > 0 && (
          <div className="mt-2">
            {selectedTags.map(tag => (
              <Badge 
                key={tag.id} 
                bg="secondary" 
                className="me-1 mb-1 p-2"
                style={{ backgroundColor: '#FFB800', color: '#1E3A5F' }}
              >
                {tag.name}
                <span 
                  className="ms-2 cursor-pointer" 
                  onClick={() => handleRemoveTag(tag.id)}
                  style={{ cursor: 'pointer' }}
                >
                  ×
                </span>
              </Badge>
            ))}
          </div>
        )}
      </Form.Group>
      
      <Button 
        variant="success" 
        type="submit"
        className="w-100"
        style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
      >
        Save Media
      </Button>
    </Form>
  );
};

export default MetadataForm;