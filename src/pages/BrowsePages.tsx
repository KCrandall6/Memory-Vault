import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Modal, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/common/ConfirmationModal';
import RecentMediaCard from '../components/recent/RecentMediaCard';
import { mediaTypeIcon, normalizeRecentMedia, RecentMediaItem } from '../components/recent/recentMedia';
import { DetailedMedia } from '../components/search/DetailsModal';
import { useMemoryDetails } from '../hooks/useMemoryDetails';
import './HomePage.css';
import './BrowsePages.css';

type BrowseKind = 'collections' | 'people' | 'tags' | 'dates';

type BrowseSummary = {
  id: string;
  name: string;
  rawName: string;
  description?: string;
  rawDescription?: string;
  isSystemGrouping?: boolean;
  mediaCount: number;
  startYear?: string;
  endYear?: string;
  startDate?: string;
  endDate?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  mediaType?: string;
};

const configs = {
  collections: {
    eyebrow: 'Browse archive',
    title: 'Collections',
    helper: 'Explore your vault by album-like groups and curated family collections.',
    empty: 'No collections yet. Collections help group memories, like Grandma’s Photos or Lake Powell Trip. Add one while uploading or editing a memory.',
    icon: 'bi-collection',
  },
  people: {
    eyebrow: 'Browse archive',
    title: 'People',
    helper: 'Explore memories by the people tagged in your vault.',
    empty: 'No people added yet. Add names while uploading or editing a memory so you can find family members later.',
    icon: 'bi-person-heart',
  },
  tags: {
    eyebrow: 'Browse archive',
    title: 'Tags',
    helper: 'Scan your most-used tags and jump into matching memories.',
    empty: 'No tags added yet. Tags are simple labels like Christmas, vacation, wedding, or school.',
    icon: 'bi-tags',
  },
  dates: {
    eyebrow: 'Timeline',
    title: 'Dates',
    helper: 'Explore dated memories by year, sorted chronologically inside each year.',
    empty: 'No dates added yet. Add a memory date while uploading or editing so you can browse your family timeline.',
    icon: 'bi-calendar3',
  },
} satisfies Record<BrowseKind, { eyebrow: string; title: string; helper: string; empty: string; icon: string }>;

const readString = (row: Record<string, unknown>, key: string) => {
  const value = row[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const normalizeSummary = (row: Record<string, unknown>, kind: BrowseKind): BrowseSummary => {
  const year = readString(row, 'year');
  const rawName = kind === 'dates' ? String(year || 'Unknown year') : String(row.name || 'Untitled');
  const normalizedName = rawName.trim().toLowerCase();
  const isSystemGrouping = kind === 'collections' && (
    row.is_system_grouping === 1 ||
    row.isSystemGrouping === true ||
    ['general', 'unfiled memories', 'ungrouped memories'].includes(normalizedName)
  );
  const rawDescription = readString(row, 'description');

  return {
    id: String(row.id || year || ''),
    name: isSystemGrouping ? 'Ungrouped Memories' : rawName,
    rawName,
    description: rawDescription || (isSystemGrouping ? 'Memories without a collection.' : undefined),
    rawDescription,
    isSystemGrouping,
    mediaCount: Number(row.media_count || row.mediaCount || 0),
    startYear: readString(row, 'start_year') || readString(row, 'startYear'),
    endYear: readString(row, 'end_year') || readString(row, 'endYear'),
    startDate: readString(row, 'start_date') || readString(row, 'startDate'),
    endDate: readString(row, 'end_date') || readString(row, 'endDate'),
    thumbnailUrl: readString(row, 'thumbnail_url') || readString(row, 'thumbnailUrl'),
    fileUrl: readString(row, 'file_url') || readString(row, 'fileUrl'),
    mediaType: readString(row, 'media_type') || readString(row, 'mediaType'),
  };
};

const yearRangeLabel = (item: BrowseSummary) => {
  if (item.startYear && item.endYear) return item.startYear === item.endYear ? item.startYear : `${item.startYear}–${item.endYear}`;
  if (item.startDate && item.endDate) return item.startDate === item.endDate ? item.startDate : `${item.startDate} – ${item.endDate}`;
  return undefined;
};

const pluralizeMemories = (count: number) => `${count} ${count === 1 ? 'memory' : 'memories'}`;

type BrowseCoverProps = {
  item: BrowseSummary;
  icon: string;
};

const BrowseCover = ({ item, icon }: BrowseCoverProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const candidate = item.thumbnailUrl || (item.mediaType?.toLowerCase() === 'image' ? item.fileUrl : undefined);
    setPreviewUrl(undefined);
    setFailed(false);

    if (!candidate) return;
    if (candidate.startsWith('data:') || !window.electronAPI?.getFilePreview) {
      setPreviewUrl(candidate);
      return;
    }

    window.electronAPI.getFilePreview(candidate)
      .then((preview) => {
        if (!cancelled) setPreviewUrl(preview?.dataUrl || candidate);
      })
      .catch((err) => {
        console.warn('Error resolving browse cover', err);
        if (!cancelled) setPreviewUrl(candidate);
      });

    return () => {
      cancelled = true;
    };
  }, [item.fileUrl, item.mediaType, item.thumbnailUrl]);

  if (previewUrl && !failed) {
    return <img src={previewUrl} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }

  return <i className={`bi ${icon}`} aria-hidden="true" />;
};

const BrowseCard = ({ item, kind, selected, onClick }: { item: BrowseSummary; kind: BrowseKind; selected: boolean; onClick: () => void }) => {
  const config = configs[kind];
  const range = yearRangeLabel(item);

  return (
    <button type="button" className={`browse-card ${kind === 'collections' ? 'browse-card--collection' : ''} ${item.isSystemGrouping ? 'browse-card--system' : ''} ${selected ? 'browse-card--selected' : ''}`} onClick={onClick}>
      <div className="browse-card__cover">
        <BrowseCover item={item} icon={config.icon} />
      </div>
      <div className="browse-card__body">
        <h3>{item.name}</h3>
        {item.description && <p>{item.description}</p>}
        <div className="browse-card__meta">
          <Badge bg="light" text="dark">{pluralizeMemories(item.mediaCount)}</Badge>
          {range && <span>{range}</span>}
        </div>
      </div>
    </button>
  );
};

const TagPill = ({ item, selected, onClick }: { item: BrowseSummary; selected: boolean; onClick: () => void }) => (
  <button type="button" className={`browse-tag-pill ${selected ? 'browse-tag-pill--selected' : ''}`} onClick={onClick}>
    <span>#{item.name}</span>
    <Badge bg="light" text="dark">{item.mediaCount}</Badge>
  </button>
);

const fetchSummaries = (kind: BrowseKind) => {
  switch (kind) {
    case 'collections':
      return window.electronAPI.getCollectionSummaries();
    case 'people':
      return window.electronAPI.getPeopleSummaries();
    case 'tags':
      return window.electronAPI.getTagSummaries();
    case 'dates':
      return window.electronAPI.getDateSummaries();
  }
};

const fetchMedia = (kind: BrowseKind, selected: BrowseSummary) => {
  switch (kind) {
    case 'collections':
      return window.electronAPI.getCollectionMedia(selected.isSystemGrouping ? selected.id : Number(selected.id));
    case 'people':
      return window.electronAPI.getPersonMedia(Number(selected.id));
    case 'tags':
      return window.electronAPI.getTagMedia(Number(selected.id));
    case 'dates':
      return window.electronAPI.getDateMedia(selected.name);
  }
};

const BrowsePage = ({ kind }: { kind: BrowseKind }) => {
  const config = configs[kind];
  const [summaries, setSummaries] = useState<BrowseSummary[]>([]);
  const [selected, setSelected] = useState<BrowseSummary | undefined>();
  const [memories, setMemories] = useState<RecentMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditCollection, setShowEditCollection] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [showDeleteCollection, setShowDeleteCollection] = useState(false);
  const [collectionDeleting, setCollectionDeleting] = useState(false);

  const handleSavedMemory = useCallback((media: DetailedMedia) => {
    setMemories((prev) => prev.map((item) => (item.id === media.id ? normalizeRecentMedia(media as unknown as Record<string, unknown>) : item)));
  }, []);

  const loadSummaries = useCallback(async (clearSelection = true) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchSummaries(kind);
      const normalized = (rows || []).map((row) => normalizeSummary(row, kind));
      setSummaries(normalized);
      if (clearSelection) {
        setSelected(undefined);
        setMemories([]);
      } else {
        setSelected((prev) => (prev ? normalized.find((item) => item.id === prev.id) || prev : prev));
      }
    } catch (err) {
      console.error('Error loading browse summaries', err);
      setError(`Unable to load ${config.title.toLowerCase()} right now.`);
    } finally {
      setLoading(false);
    }
  }, [config.title, kind]);

  const handleDeletedMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((item) => item.id !== id));
    loadSummaries(false);
  }, [loadSummaries]);

  const { openMemory, detailsModal } = useMemoryDetails({ onSaved: handleSavedMemory, onDeleted: handleDeletedMemory });

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const openGroup = async (item: BrowseSummary) => {
    setSelected(item);
    setLoadingMedia(true);
    setError(null);
    try {
      const rows = await fetchMedia(kind, item);
      setMemories((rows || []).map(normalizeRecentMedia));
    } catch (err) {
      console.error('Error loading browse media', err);
      setError(`Unable to load memories for ${item.name}.`);
      setMemories([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  const openEditCollection = () => {
    if (!selected || kind !== 'collections') return;
    setCollectionName(selected.rawName || selected.name);
    setCollectionDescription(selected.rawDescription || '');
    setShowEditCollection(true);
  };

  const saveCollectionDetails = async () => {
    if (!selected || !collectionName.trim()) return;
    setCollectionSaving(true);
    try {
      const response = await window.electronAPI.updateCollectionDetails({
        id: Number(selected.id),
        name: collectionName.trim(),
        description: collectionDescription,
      });
      if (response.success) {
        setShowEditCollection(false);
        await loadSummaries(false);
      } else {
        setError(response.error || 'Unable to save collection details.');
      }
    } finally {
      setCollectionSaving(false);
    }
  };

  const deleteSelectedCollection = async () => {
    if (!selected) return;
    setCollectionDeleting(true);
    try {
      const response = await window.electronAPI.deleteCollection(Number(selected.id));
      if (response.success) {
        setShowDeleteCollection(false);
        setSelected(undefined);
        setMemories([]);
        await loadSummaries();
      } else if (response.blocked) {
        setShowDeleteCollection(false);
        setError('This collection contains memories. Move or edit those memories before deleting the collection.');
      } else {
        setError(response.error || 'Unable to delete collection.');
      }
    } finally {
      setCollectionDeleting(false);
    }
  };

  const selectedTitle = selected
    ? selected.isSystemGrouping
      ? 'Ungrouped Memories'
      : `${selected.name} memories`
    : `Choose ${config.title.toLowerCase()}`;
  const iconForEmpty = useMemo(() => mediaTypeIcon.unknown, []);

  return (
    <Container fluid className="home-dashboard px-0 browse-page">
      <section className="home-section mt-0">
        <div className="home-section__heading browse-page__heading">
          <div>
            <p className="home-section__eyebrow">{config.eyebrow}</p>
            <h1 className="mb-1">Browse {config.title}</h1>
            <p className="home-section__hint text-start">{config.helper}</p>
          </div>
        </div>

        {error && <Alert variant="warning">{error}</Alert>}

        {loading ? (
          <div className={kind === 'tags' ? 'browse-tag-grid' : kind === 'collections' ? 'browse-card-grid browse-card-grid--collections' : 'browse-card-grid'}>
            {Array.from({ length: kind === 'tags' ? 12 : 6 }).map((_, index) => (
              <Card className="home-recent-card home-recent-card--skeleton" key={index}>
                <div className="home-recent-card__preview" />
                <Card.Body><span /><strong /></Card.Body>
              </Card>
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <Card className="home-empty-state border-0">
            <Card.Body>
              <div className="home-empty-state__icon"><i className={`bi ${config.icon}`} aria-hidden="true" /></div>
              <h3>Nothing to browse yet.</h3>
              <p>{config.empty}</p>
              <Button as={Link} to="/upload" variant="warning">Upload Memories</Button>
            </Card.Body>
          </Card>
        ) : kind === 'tags' ? (
          <div className="browse-tag-grid">
            {summaries.map((item) => (
              <TagPill key={item.id} item={item} selected={selected?.id === item.id} onClick={() => openGroup(item)} />
            ))}
          </div>
        ) : (
          <div className={kind === 'collections' ? 'browse-card-grid browse-card-grid--collections' : 'browse-card-grid'}>
            {summaries.map((item) => (
              <BrowseCard key={item.id} item={item} kind={kind} selected={selected?.id === item.id} onClick={() => openGroup(item)} />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__heading browse-page__heading">
          <div>
            <p className="home-section__eyebrow">Selected group</p>
            <h2>{selectedTitle}</h2>
          </div>
          {loadingMedia && <Spinner animation="border" role="status" size="sm" className="text-primary" />}
        </div>

        {selected && kind === 'collections' && (
          <Card className="browse-collection-details border-0 mb-3">
            <Card.Body>
              <div>
                <div className="text-muted small mb-1">Collection details</div>
                <p className="mb-0">{selected.description || 'No description yet.'}</p>
                {selected.isSystemGrouping ? (
                  <div className="text-muted small mt-2">This is a system grouping for memories that do not belong to a collection.</div>
                ) : selected.mediaCount > 0 && (
                  <div className="text-muted small mt-2">Delete is available only when a collection is empty.</div>
                )}
              </div>
              {!selected.isSystemGrouping && (
                <div className="d-flex flex-wrap gap-2">
                  <Button variant="outline-primary" size="sm" onClick={openEditCollection}>Edit collection</Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    disabled={selected.mediaCount > 0}
                    title={selected.mediaCount > 0 ? 'Move memories out of this collection before deleting it.' : undefined}
                    onClick={() => setShowDeleteCollection(true)}
                  >
                    Delete collection
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {!selected ? (
          <Card className="browse-selection-empty border-0">
            <Card.Body>
              <i className={`bi ${iconForEmpty}`} aria-hidden="true" />
              <p>Select an item above to browse matching memories.</p>
            </Card.Body>
          </Card>
        ) : !loadingMedia && memories.length === 0 ? (
          <Card className="browse-selection-empty border-0">
            <Card.Body>
              <i className={`bi ${config.icon}`} aria-hidden="true" />
              <p>No memories found for {selected.name}. Try adding or editing details on a memory so it appears here.</p>
            </Card.Body>
          </Card>
        ) : (
          <div className="home-recent-grid" aria-live="polite">
            {memories.map((item) => (
              <RecentMediaCard key={item.id} item={item} onOpen={openMemory} />
            ))}
          </div>
        )}
      </section>
      <Modal show={showEditCollection} onHide={() => setShowEditCollection(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="collectionName">
            <Form.Label>Collection name</Form.Label>
            <Form.Control
              value={collectionName}
              onChange={(event) => setCollectionName(event.target.value)}
              placeholder="Collection name"
              required
            />
          </Form.Group>
          <Form.Group controlId="collectionDescription" className="mt-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={collectionDescription}
              onChange={(event) => setCollectionDescription(event.target.value)}
              placeholder="Describe this collection"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditCollection(false)} disabled={collectionSaving}>Cancel</Button>
          <Button
            variant="success"
            style={{ backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' }}
            disabled={!collectionName.trim() || collectionSaving}
            onClick={saveCollectionDetails}
          >
            {collectionSaving ? 'Saving…' : 'Save collection'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmationModal
        show={showDeleteCollection}
        title="Delete collection?"
        message="This deletes only the empty collection. No memories or archived files will be deleted."
        cancelLabel="Keep collection"
        confirmLabel="Delete collection"
        destructive
        confirming={collectionDeleting}
        onCancel={() => setShowDeleteCollection(false)}
        onConfirm={deleteSelectedCollection}
      />

      {detailsModal}
    </Container>
  );
};

export const BrowseCollectionsPage = () => <BrowsePage kind="collections" />;
export const BrowsePeoplePage = () => <BrowsePage kind="people" />;
export const BrowseTagsPage = () => <BrowsePage kind="tags" />;
export const BrowseDatesPage = () => <BrowsePage kind="dates" />;
