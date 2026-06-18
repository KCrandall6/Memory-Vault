import { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import FiltersBar from '../components/search/FilterBar';
import SearchBar, { ReferenceOption, SearchQuery } from '../components/search/SearchBar';
import DetailsModal, { DetailedMedia } from '../components/search/DetailsModal';
import { isRendererSafePreviewUrl } from '../components/recent/recentMedia';
import { resolveDetailPreview } from '../hooks/useMemoryDetails';

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

type SearchResult = DetailedMedia & {
  mediaTypeId?: number;
  summary?: string;
};

const mediaTypeIcon: Record<string, string> = {
  image: 'bi-image',
  video: 'bi-camera-video',
  document: 'bi-file-earmark-text',
  audio: 'bi-music-note',
};

const mapReference = (items: any[] = []): ReferenceOption[] =>
  items.map((item) => ({ id: String(item.id), name: item.name }));


const normalizeMemoryNotes = (row: any) => {
  const notes = row.memory_notes || row.memoryNotes || [];
  return Array.isArray(notes)
    ? notes.map((note) => ({
        id: Number(note.id),
        media_id: Number(note.media_id),
        author_name: typeof note.author_name === 'string' ? note.author_name : null,
        content: String(note.content || ''),
        created_at: String(note.created_at || '')
      }))
    : [];
};

const normalizeResult = (row: any): SearchResult => ({
  id: String(row.id),
  title: row.title || row.file_name || 'Untitled memory',
  description: row.description || '',
  summary: row.description || undefined,
  captureDate: row.capture_date || '',
  uploadDate: row.created_at ? String(row.created_at).split('T')[0] : undefined,
  location: row.location || '',
  collection: row.collection_name || 'Ungrouped Memories',
  mediaType: row.media_type ? String(row.media_type).toLowerCase() : 'document',
  mediaTypeId: row.media_type_id,
  tags: row.tags || [],
  people: row.people || [],
  thumbnail: row.thumbnail_url || undefined,
  filePath: row.file_path || undefined,
  fileUrl: row.file_url || undefined,
});

const normalizeDetails = (row: any): DetailedMedia => ({
  id: String(row.id),
  title: row.title || row.file_name || 'Untitled memory',
  description: row.description || '',
  captureDate: row.capture_date || row.captureDate || '',
  uploadDate: row.created_at ? String(row.created_at).split('T')[0] : row.uploadDate,
  location: row.location || '',
  collection: row.collection_name || row.collection || 'Ungrouped Memories',
  mediaType: row.media_type ? String(row.media_type).toLowerCase() : row.mediaType || 'document',
  mediaTypeId: row.media_type_id || row.mediaTypeId || undefined,
  tags: row.tags || [],
  people: row.people || [],
  thumbnail: row.thumbnail_url || row.thumbnail || undefined,
  filePath: row.file_path || row.filePath || undefined,
  fileUrl: row.file_url || row.fileUrl || undefined,
  memoryNotes: normalizeMemoryNotes(row),
});

const SearchPage = () => {
  const [query, setQuery] = useState<SearchQuery>(initialQuery);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<ReferenceOption[]>([]);
  const [availableCollections, setAvailableCollections] = useState<ReferenceOption[]>([]);
  const [availablePeople, setAvailablePeople] = useState<ReferenceOption[]>([]);
  const [availableTags, setAvailableTags] = useState<ReferenceOption[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<DetailedMedia | undefined>();
  const [showDetails, setShowDetails] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [resolvedResults, setResolvedResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [mediaTypes, collections, people, tags] = await Promise.all([
          window.electronAPI.getMediaTypes(),
          window.electronAPI.getCollections(),
          window.electronAPI.getPeople(),
          window.electronAPI.getTags(),
        ]);
        setAvailableMediaTypes(mapReference(mediaTypes));
        setAvailableCollections(mapReference(collections));
        setAvailablePeople(mapReference(people));
        setAvailableTags(mapReference(tags));
      } catch (err) {
        console.warn('Error loading reference data', err);
      }
    };

    loadReferenceData();
  }, []);

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

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const criteria = {
        text: query.text,
        title: query.title,
        location: query.location,
        mediaTypeIds: query.mediaTypes.map((id) => Number(id)).filter(Boolean),
        collectionIds: query.collections.map((id) => Number(id)).filter(Boolean),
        tagIds: query.tags.map((id) => Number(id)).filter(Boolean),
        personIds: query.people.map((id) => Number(id)).filter(Boolean),
        dateFrom: query.dateFrom || undefined,
        dateTo: query.dateTo || undefined,
        peopleText: query.peopleText,
        tagsText: query.tagsText,
        sort: query.sort,
        limit: 25,
        offset: 0,
      };
      const resultsFromDb = await window.electronAPI.searchMedia(criteria);
      setResults(resultsFromDb.map(normalizeResult));
      setHasSearched(true);
    } catch (err) {
      console.error('Error searching media', err);
      setError('Something went wrong while searching your memories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    const resolvePreviews = async () => {
      setResolvedResults(results);

      const getFilePreview = window.electronAPI?.getFilePreview;

      if (!getFilePreview) {
        return;
      }

      const hydrated = await Promise.all(
        results.map(async (result) => {
          if (result.thumbnail?.startsWith('data:')) return result;

          const candidate = result.thumbnail || result.fileUrl || result.filePath;
          if (!candidate) return result;

          try {
            const preview = await getFilePreview(candidate);
            if (preview?.dataUrl) {
              return { ...result, thumbnail: preview.dataUrl };
            }
          } catch (err) {
            console.warn('Error resolving preview', err);
          }

          return result;
        })
      );

      if (!cancelled) {
        setResolvedResults(hydrated);
      }
    };

    resolvePreviews();

    return () => {
      cancelled = true;
    };
  }, [results]);

  const handleViewDetails = async (result: SearchResult) => {
    try {
      const details = await window.electronAPI.getMediaDetails(Number(result.id));
      const normalized = await resolveDetailPreview(details ? normalizeDetails(details) : normalizeDetails(result));

      setSelected(normalized);
      setShowDetails(true);
    } catch (err) {
      console.error('Error loading media details', err);
      setSelected(normalizeDetails(result));
      setShowDetails(true);
    }
  };

  const handleDeleteDetails = async (media: DetailedMedia) => {
    const response = await window.electronAPI.deleteMedia(Number(media.id));
    if (!response.success) {
      throw new Error(response.error || 'Delete failed');
    }
    if (response.success) {
      setShowDetails(false);
      setSelected(undefined);
      setResults((prev) => prev.filter((item) => item.id !== media.id));
      setResolvedResults((prev) => prev.filter((item) => item.id !== media.id));
    }
  };

  const handleSaveDetails = async (updated: DetailedMedia) => {
    try {
      const payload = {
        id: Number(updated.id),
        title: updated.title,
        description: updated.description,
        captureDate: updated.captureDate,
        location: updated.location,
        collection: updated.collection,
        tags: updated.tags || [],
        people: updated.people || [],
        mediaTypeId: updated.mediaTypeId || results.find((item) => item.id === updated.id)?.mediaTypeId || undefined,
      };
      const response = await window.electronAPI.updateMediaDetails(payload);
      if (!response.success) {
        throw new Error(response.error || 'Save failed');
      }
      if (response.media) {
        const normalized = await resolveDetailPreview(normalizeDetails(response.media));
        setSelected(normalized);
        setResults((prev) => prev.map((item) => (item.id === String(payload.id) ? { ...item, ...normalized } : item)));
        setResolvedResults((prev) => prev.map((item) => (item.id === String(payload.id) ? { ...item, ...normalized } : item)));
      }
    } catch (err) {
      console.error('Error saving media details', err);
      throw err;
    }
  };

  const hasResults = results.length > 0;

  const getThumbnail = (result: SearchResult) => {
    if (result.thumbnail && isRendererSafePreviewUrl(result.thumbnail)) return result.thumbnail;
    if (result.fileUrl && isRendererSafePreviewUrl(result.fileUrl)) return result.fileUrl;
    return undefined;
  };

  return (
    <Container fluid className="py-4" style={{ maxWidth: '1400px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-1">Search Memories</h1>
          <div className="text-muted">Find a specific memory by title, people, tags, dates, locations, or collections.</div>
        </div>
        {selectedCount > 0 && <span className="badge bg-secondary">{selectedCount} active filters</span>}
      </div>

      <SearchBar
        query={query}
        onQueryChange={handleQueryChange}
        onSubmit={handleSubmit}
        advancedOpen={advancedOpen}
        onToggleAdvanced={() => setAdvancedOpen((prev) => !prev)}
        availableMediaTypes={availableMediaTypes}
        availableCollections={availableCollections}
        availablePeople={availablePeople}
        availableTags={availableTags}
      />

      {hasResults && (
        <FiltersBar
          query={query}
          onQueryChange={handleQueryChange}
          availableMediaTypes={availableMediaTypes}
          availableCollections={availableCollections}
          availablePeople={availablePeople}
          availableTags={availableTags}
          onReset={resetFilters}
        />
      )}

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      <Row className="mt-4">
        <Col>
          {hasResults ? (
            <Card className="shadow-sm">
              <Card.Body className="p-0 position-relative">
                {loading && (
                  <div className="position-absolute top-0 bottom-0 start-0 end-0 d-flex align-items-center justify-content-center bg-white bg-opacity-75">
                    <Spinner animation="border" role="status" />
                  </div>
                )}
                {resolvedResults.map((result) => {
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
                            <div className="text-muted small mb-2 d-flex flex-wrap gap-3 align-items-center">
                              <span>
                                <span className="fw-semibold">Memory Date:</span> {result.captureDate || '—'}
                              </span>
                                <span>
                                  <span className="fw-semibold">Location:</span> {result.location || '—'}
                                </span>
                                <span>
                                  <span className="fw-semibold">Collection:</span> {result.collection || '—'}
                                </span>
                            </div>
                            <div className="d-flex flex-wrap gap-3 align-items-center">
                              {result.people && result.people.length > 0 && (
                                <div className="d-flex flex-wrap gap-1 align-items-center">
                                  <span className="text-muted small fw-semibold me-1">People:</span>
                                  {result.people.map((person) => (
                                    <Badge key={person} className="people-chip">
                                      {person}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {result.tags && result.tags.length > 0 && (
                                <div className="d-flex flex-wrap gap-1 align-items-center">
                                  <span className="text-muted small fw-semibold me-1">Tags:</span>
                                  {result.tags.slice(0, 5).map((tag) => (
                                    <Badge key={tag} bg="light" text="secondary" className="border">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <Button
                              variant="success"
                              size="sm"
                              style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
                              onClick={() => handleViewDetails(result)}
                            >
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
              {hasSearched ? (<>No memories found. Try searching by title, person, tag, location, date, or note.</>) : (<>Start by searching for memories using the bar above, or <Link to="/upload">upload your first memory</Link>.</>)}
            </div>
          )}
        </Col>
      </Row>

      <DetailsModal
        show={showDetails}
        media={selected}
        onClose={() => setShowDetails(false)}
        onSaveDetails={handleSaveDetails}
        onDeleteDetails={handleDeleteDetails}
        availableMediaTypes={availableMediaTypes}
        availableCollections={availableCollections}
        availablePeople={availablePeople}
        availableTags={availableTags}
      />
    </Container>
  );
};

export default SearchPage;