import { useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import FiltersBar from '../components/search/FiltersBar';
import SearchBar, { ReferenceOption, SearchQuery } from '../components/search/SearchBar';

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

type SearchResult = {
  id: string;
  title: string;
  thumbnail: string;
  captureDate: string;
  collection?: string;
  peopleCount: number;
  location?: string;
  mediaType: string;
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
  },
  {
    id: 'm4',
    title: 'Project brief PDF',
    thumbnail: 'https://via.placeholder.com/400x250?text=PDF',
    captureDate: '2019-11-02',
    collection: 'Work',
    peopleCount: 1,
    location: 'Remote',
    mediaType: 'document',
  },
  {
    id: 'm5',
    title: 'Interview audio',
    thumbnail: 'https://via.placeholder.com/400x250?text=Audio',
    captureDate: '2015-04-10',
    collection: 'Family',
    peopleCount: 2,
    location: 'Phone',
    mediaType: 'audio',
  },
];

const SearchPage = () => {
  const [query, setQuery] = useState<SearchQuery>(initialQuery);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

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
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="d-flex align-items-stretch border-bottom px-3 py-3 gap-3 flex-wrap flex-md-nowrap"
                  >
                    <div className="search-result-thumb flex-shrink-0">
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="img-fluid rounded"
                        style={{ minWidth: '140px', maxWidth: '180px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-1">{result.title}</h5>
                          <div className="text-muted small mb-2 d-flex flex-wrap gap-2 align-items-center">
                            <span>{result.captureDate}</span>
                            {result.location && <span>• {result.location}</span>}
                            {result.collection && (
                              <Badge bg="light" text="dark">
                                {result.collection}
                              </Badge>
                            )}
                            <Badge bg="secondary">{result.peopleCount} people</Badge>
                            <Badge bg="light" text="primary" className="border border-primary">
                              {result.mediaType}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Button variant="outline-primary" size="sm">
                            View details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          ) : (
            <div className="bg-white rounded-3 shadow-sm p-4 text-center text-muted">
              Start by searching for memories using the bar above.
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SearchPage;