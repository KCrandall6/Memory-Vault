import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Container, Spinner } from 'react-bootstrap';
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
  description?: string;
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
    empty: 'No collections yet. Create or select collections while uploading memories.',
    icon: 'bi-collection',
  },
  people: {
    eyebrow: 'Browse archive',
    title: 'People',
    helper: 'Explore memories by the people tagged in your vault.',
    empty: 'No people have been tagged yet. Add people while uploading or editing memories.',
    icon: 'bi-person-heart',
  },
  tags: {
    eyebrow: 'Browse archive',
    title: 'Tags',
    helper: 'Scan your most-used tags and jump into matching memories.',
    empty: 'No tags have been added yet. Add tags while uploading or editing memories.',
    icon: 'bi-tags',
  },
  dates: {
    eyebrow: 'Timeline',
    title: 'Dates',
    helper: 'Explore dated memories by year, sorted chronologically inside each year.',
    empty: 'No memories have capture dates yet. Add dates while uploading or editing memories.',
    icon: 'bi-calendar3',
  },
} satisfies Record<BrowseKind, { eyebrow: string; title: string; helper: string; empty: string; icon: string }>;

const readString = (row: Record<string, unknown>, key: string) => {
  const value = row[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const normalizeSummary = (row: Record<string, unknown>, kind: BrowseKind): BrowseSummary => {
  const year = readString(row, 'year');
  return {
    id: String(row.id || year || ''),
    name: kind === 'dates' ? String(year || 'Unknown year') : String(row.name || 'Untitled'),
    description: readString(row, 'description'),
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
    <button type="button" className={`browse-card ${selected ? 'browse-card--selected' : ''}`} onClick={onClick}>
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
      return window.electronAPI.getCollectionMedia(Number(selected.id));
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

  const handleSavedMemory = useCallback((media: DetailedMedia) => {
    setMemories((prev) => prev.map((item) => (item.id === media.id ? normalizeRecentMedia(media as unknown as Record<string, unknown>) : item)));
  }, []);

  const { openMemory, detailsModal } = useMemoryDetails({ onSaved: handleSavedMemory });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchSummaries(kind);
        setSummaries((rows || []).map((row) => normalizeSummary(row, kind)));
        setSelected(undefined);
        setMemories([]);
      } catch (err) {
        console.error('Error loading browse summaries', err);
        setError(`Unable to load ${config.title.toLowerCase()} right now.`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [config.title, kind]);

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

  const selectedTitle = selected ? `${selected.name} memories` : `Choose ${config.title.toLowerCase()}`;
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
          <div className={kind === 'tags' ? 'browse-tag-grid' : 'browse-card-grid'}>
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
            </Card.Body>
          </Card>
        ) : kind === 'tags' ? (
          <div className="browse-tag-grid">
            {summaries.map((item) => (
              <TagPill key={item.id} item={item} selected={selected?.id === item.id} onClick={() => openGroup(item)} />
            ))}
          </div>
        ) : (
          <div className="browse-card-grid">
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
              <p>No memories found for {selected.name}.</p>
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
      {detailsModal}
    </Container>
  );
};

export const BrowseCollectionsPage = () => <BrowsePage kind="collections" />;
export const BrowsePeoplePage = () => <BrowsePage kind="people" />;
export const BrowseTagsPage = () => <BrowsePage kind="tags" />;
export const BrowseDatesPage = () => <BrowsePage kind="dates" />;
