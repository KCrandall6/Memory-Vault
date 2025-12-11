import React from 'react';
import { Form, InputGroup, Button, Row, Col, Collapse } from 'react-bootstrap';

export type SearchQuery = {
  text: string;
  title: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  sort: 'newest' | 'oldest' | 'title' | 'type';
  mediaTypes: string[];
  collections: string[];
  people: string[];
  tags: string[];
  peopleText: string;
  tagsText: string;
};

export type ReferenceOption = {
  id: string;
  name: string;
};

type SearchBarProps = {
  query: SearchQuery;
  onQueryChange: (partial: Partial<SearchQuery>) => void;
  onSubmit: () => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  availableMediaTypes: ReferenceOption[];
  availableCollections: ReferenceOption[];
  availablePeople: ReferenceOption[];
  availableTags: ReferenceOption[];
};

const SearchBar = ({
  query,
  onQueryChange,
  onSubmit,
  advancedOpen,
  onToggleAdvanced,
  availableMediaTypes,
  availableCollections,
  availablePeople,
  availableTags,
}: SearchBarProps) => {
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange({ text: event.target.value });
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange({ title: event.target.value });
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange({ location: event.target.value });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onQueryChange({ sort: event.target.value as SearchQuery['sort'] });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onQueryChange({ [name]: value } as Partial<SearchQuery>);
  };

  const handleMultiSelectChange = (
    field: keyof Pick<SearchQuery, 'collections' | 'people' | 'tags' | 'mediaTypes'>,
    values: string[]
  ) => {
    onQueryChange({ [field]: values } as Partial<SearchQuery>);
  };

  return (
    <div className="bg-white rounded-3 shadow-sm p-3 sticky-top" style={{ top: '80px', zIndex: 10 }}>
      <Row className="g-3 align-items-center">
        <Col lg={4} md={12}>
          <InputGroup>
            <Form.Control
              type="search"
              placeholder="Search memories, people, tags..."
              value={query.text}
              onChange={handleTextChange}
            />
            <Button variant="primary" onClick={onSubmit}>
              Search
            </Button>
          </InputGroup>
        </Col>
        <Col lg={2} md={4} sm={6}>
          <Form.Control
            type="text"
            placeholder="Location"
            value={query.location}
            onChange={handleLocationChange}
          />
        </Col>
        <Col lg={2} md={4} sm={6}>
          <InputGroup>
            <Form.Control
              type="date"
              name="dateFrom"
              value={query.dateFrom}
              onChange={handleDateChange}
              aria-label="Capture date from"
            />
            <Form.Control
              type="date"
              name="dateTo"
              value={query.dateTo}
              onChange={handleDateChange}
              aria-label="Capture date to"
            />
          </InputGroup>
        </Col>
        <Col lg={2} md={4} sm={6}>
          <Form.Select value={query.sort} onChange={handleSortChange}>
            <option value="newest">Date newest</option>
            <option value="oldest">Date oldest</option>
            <option value="title">Title A–Z</option>
            <option value="type">Type</option>
          </Form.Select>
        </Col>
        <Col lg={2} md={4} sm={6} className="d-flex justify-content-end">
          <Button variant="outline-secondary" onClick={onToggleAdvanced}>
            {advancedOpen ? 'Hide advanced' : 'Advanced search'}
          </Button>
        </Col>
      </Row>

    <Collapse in={advancedOpen}>
        <div className="mt-3 border-top pt-3">
          <Row className="g-3 align-items-end">
            <Col lg={3} md={6}>
              <Form.Group controlId="advanced-title">
                <Form.Label className="small text-muted">Memory name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Title contains..."
                  value={query.title}
                  onChange={handleTitleChange}
                />
              </Form.Group>
            </Col>
            <Col lg={3} md={6}>
              <Form.Group controlId="advanced-media-type">
                <Form.Label className="small text-muted">Media type</Form.Label>
                <Form.Select
                  value={query.mediaTypes[0] ?? ''}
                  onChange={(event) =>
                    handleMultiSelectChange(
                      'mediaTypes',
                      event.target.value ? [event.target.value] : []
                    )
                  }
                >
                  <option value="">Any type</option>
                  {availableMediaTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={3} md={6}>
              <Form.Group controlId="advanced-people">
                <Form.Label className="small text-muted">People</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search people"
                  value={query.peopleText}
                  onChange={(event) => onQueryChange({ peopleText: event.target.value })}
                  list="people-suggestions"
                />
                <datalist id="people-suggestions">
                  {availablePeople
                    .filter((person) =>
                      person.name.toLowerCase().includes(query.peopleText.toLowerCase())
                    )
                    .sort((a, b) => {
                      const q = query.peopleText.toLowerCase();
                      const score = (name: string) =>
                        name.toLowerCase().startsWith(q) ? 0 : name.toLowerCase().indexOf(q);
                      return score(a.name) - score(b.name);
                    })
                    .map((person) => (
                      <option key={person.id} value={person.name} />
                    ))}
                </datalist>
              </Form.Group>
            </Col>
            <Col lg={3} md={6}>
              <Form.Group controlId="advanced-tags">
                <Form.Label className="small text-muted">Tags</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search tags"
                  value={query.tagsText}
                  onChange={(event) => onQueryChange({ tagsText: event.target.value })}
                  list="tag-suggestions"
                />
                <datalist id="tag-suggestions">
                  {availableTags
                    .filter((tag) => tag.name.toLowerCase().includes(query.tagsText.toLowerCase()))
                    .sort((a, b) => {
                      const q = query.tagsText.toLowerCase();
                      const score = (name: string) =>
                        name.toLowerCase().startsWith(q) ? 0 : name.toLowerCase().indexOf(q);
                      return score(a.name) - score(b.name);
                    })
                    .map((tag) => (
                      <option key={tag.id} value={tag.name} />
                    ))}
                </datalist>
              </Form.Group>
            </Col>
          </Row>
        </div>
      </Collapse>
    </div>
  );
};

export default SearchBar;