import { useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import FiltersBar from '../components/search/FilterBar';
import SearchBar, { ReferenceOption, SearchQuery } from '../components/search/SearchBar';
import DetailsModal, { DetailedMedia } from '../components/search/DetailsModal';

const initialQuery: SearchQuery = {
  text: '',
  title: '',
  location: '',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
  mediaTypes: [],
  collections: [],
  people: [],
  tags: [],
  peopleText: '',
  tagsText: '',
};

const mockMediaTypes: ReferenceOption[] = [
  { id: 'image', name: 'Image' },
  { id: 'video', name: 'Video' },
  { id: 'document', name: 'Document' },
  { id: 'audio', name: 'Audio' },
];

const mockCollections: ReferenceOption[] = [
  { id: '1', name: 'Family' },
  { id: '2', name: 'Vacations' },
  { id: '3', name: 'Work' },
];

const mockPeople: ReferenceOption[] = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Charlie' },
];

const mockTags: ReferenceOption[] = [
  { id: 't1', name: 'Outdoors' },
  { id: 't2', name: 'Family' },
  { id: 't3', name: 'Birthday' },
  { id: 't4', name: 'Travel' },
];

type SearchResult = DetailedMedia & {
  peopleCount: number;
  summary?: string;
};

const mockResults: SearchResult[] = [
  {
    id: 'm1',
    title: 'Family picnic 1998',
    thumbnail: 'https://via.placeholder.com/400x250?text=Picnic',
    captureDate: '1998-06-14',
    collection: 'Family',
    peopleCount: 4,
    location: 'Central Park',
    mediaType: 'image',
    description: 'Sunny afternoon picnic with the family and cousins.',
    tags: ['family', 'outdoors'],
    people: ['Alice', 'Bob', 'Charlie', 'Dana'],
  },
  {
    id: 'm2',
    title: 'Graduation day',
    thumbnail: 'https://via.placeholder.com/400x250?text=Graduation',
    captureDate: '2008-05-30',
    collection: 'Work',
    peopleCount: 3,
    location: 'Madison',
    mediaType: 'image',
    summary: 'Ceremony photos and program',
    description: 'Commencement ceremony with friends and the graduation program PDF.',
    people: ['Erin', 'Frank', 'Grace'],
    tags: ['milestone', 'school'],
  },
  {
    id: 'm3',
    title: 'Hiking the Alps',
    thumbnail: 'https://via.placeholder.com/400x250?text=Alps',
    captureDate: '2012-09-18',
    collection: 'Vacations',
    peopleCount: 2,
    location: 'Switzerland',
    mediaType: 'image',
    summary: 'Trail snapshots and summit panorama',
    description: 'A week-long hike through the Alps with amazing views.',
    people: ['Hannah', 'Ian'],
    tags: ['travel', 'mountains'],
  },
  {
    id: 'm4',
    title: 'Project brief PDF',
    thumbnail: '',
    captureDate: '2019-11-02',
    collection: 'Work',
    peopleCount: 1,
    location: 'Remote',
    mediaType: 'document',
    summary: 'Requirements document for Q4 initiative',
    tags: ['work', 'planning'],
    description: 'Project brief outlining goals and timelines.',
    people: ['Manager'],
  },
  {
    id: 'm5',
    title: 'Interview audio',
    thumbnail: '',
    captureDate: '2015-04-10',
    collection: 'Family',
    peopleCount: 2,
    location: 'Phone',
    mediaType: 'audio',
    summary: 'Grandma shares family stories',
    description: 'Audio interview capturing family history anecdotes.',
    people: ['Grandma', 'Host'],
    tags: ['family', 'oral history'],
  },
];

const mediaTypeIcon: Record<string, string> = {
  image: 'bi-image',
  video: 'bi-camera-video',
  document: 'bi-file-earmark-text',
  audio: 'bi-music-note',
};

const getThumbnail = (result: SearchResult) => {
  if (result.thumbnail) return result.thumbnail;
  return undefined;
};

const SearchPage = () => {
  const [query, setQuery] = useState<SearchQuery>(initialQuery);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | undefined>();
  const [showDetails, setShowDetails] = useState(false);

  const handleQueryChange = (partial: Partial<SearchQuery>) => {
    setQuery((prev) => ({ ...prev, ...partial }));
  };

  const resetFilters = () => {
    setQuery((prev) => ({
      ...prev,
      mediaTypes: [],
      collections: [],
      people: [],
      tags: [],
      location: '',
      dateFrom: '',
      dateTo: '',
      peopleText: '',
      tagsText: '',
    }));
  };

  const selectedCount = useMemo(
    () => query.mediaTypes.length + query.collections.length + query.people.length + query.tags.length,
    [query.collections.length, query.mediaTypes.length, query.people.length, query.tags.length]
  );

  const handleSubmit = () => {
    setResults(mockResults);
  };

  const handleViewDetails = (result: SearchResult) => {
    setSelected(result);
    setShowDetails(true);
  };

  const handleSaveDetails = (updated: DetailedMedia) => {
    setResults((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    setSelected((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const hasResults = results.length > 0;

  return (
    <Container fluid className="py-4" style={{ maxWidth: '1400px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-1">Search Media</h1>
          <div className="text-muted">Find memories by keywords, people, places, and more.</div>
        </div>
        {selectedCount > 0 && <span className="badge bg-secondary">{selectedCount} active filters</span>}
      </div>

      <SearchBar
        query={query}
        onQueryChange={handleQueryChange}
        onSubmit={handleSubmit}
        advancedOpen={advancedOpen}
        onToggleAdvanced={() => setAdvancedOpen((prev) => !prev)}
        availableMediaTypes={mockMediaTypes}
        availableCollections={mockCollections}
        availablePeople={mockPeople}
        availableTags={mockTags}
      />

      {hasResults && (
        <FiltersBar
          query={query}
          onQueryChange={handleQueryChange}
          availableMediaTypes={mockMediaTypes}
          availableCollections={mockCollections}
          availablePeople={mockPeople}
          availableTags={mockTags}
          onReset={resetFilters}
        />
      )}

      <Row className="mt-4">
        <Col>
          {hasResults ? (
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                {results.map((result) => {
                  const icon = mediaTypeIcon[result.mediaType] ?? 'bi-file-earmark';
                  return (
                    <div
                      key={result.id}
                      className="d-flex align-items-stretch border-bottom px-3 py-3 gap-3 flex-wrap flex-md-nowrap"
                    >
                      <div
                        className="search-result-thumb flex-shrink-0 d-flex align-items-center justify-content-center bg-light position-relative rounded"
                        style={{ minWidth: '140px', maxWidth: '180px', height: '120px' }}
                      >
                        {getThumbnail(result) ? (
                          <img
                            src={getThumbnail(result)}
                            alt={result.title}
                            className="img-fluid rounded h-100 w-100"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <i className={`bi ${icon} display-6 text-muted`}></i>
                        )}
                        <div className="position-absolute bottom-0 start-0 m-2">
                          <Badge bg="dark" className="text-uppercase small">{result.mediaType}</Badge>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="mb-1">{result.title}</h5>
                            {result.summary && <div className="text-muted small mb-2">{result.summary}</div>}
                            <div className="text-muted small mb-2 d-flex flex-wrap gap-2 align-items-center">
                              <span>{result.captureDate}</span>
                              {result.location && <span>• {result.location}</span>}
                              {result.collection && (
                                <Badge bg="light" text="dark">
                                  {result.collection}
                                </Badge>
                              )}
                              <Badge bg="secondary">{result.peopleCount} people</Badge>
                              {result.tags && result.tags.length > 0 && (
                                <span className="d-flex flex-wrap gap-1">
                                  {result.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} bg="light" text="primary" className="border border-primary">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(result)}>
                              View details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          ) : (
            <div className="bg-white rounded-3 shadow-sm p-4 text-center text-muted">
              Start by searching for memories using the bar above.
            </div>
          )}
        </Col>
      </Row>

      <DetailsModal
        show={showDetails}
        media={selected}
        onClose={() => setShowDetails(false)}
        onSaveDetails={handleSaveDetails}
        availableCollections={mockCollections}
        availablePeople={mockPeople}
        availableTags={mockTags}
      />
    </Container>
  );
};

export default SearchPage;