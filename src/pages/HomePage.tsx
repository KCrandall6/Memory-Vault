// src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './HomePage.css';

type DashboardSummary = {
  totalMedia: number;
  collectionsCount: number;
  peopleCount: number;
  tagsCount: number;
  mediaTypeCounts: Record<string, number>;
};

type RecentMediaRow = Record<string, unknown>;

const readString = (row: RecentMediaRow, key: string) => {
  const value = row[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

type RecentMedia = {
  id: string;
  title: string;
  fileName: string;
  mediaType: string;
  collection?: string;
  captureDate?: string;
  createdAt?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
};

const defaultSummary: DashboardSummary = {
  totalMedia: 0,
  collectionsCount: 0,
  peopleCount: 0,
  tagsCount: 0,
  mediaTypeCounts: {},
};

const mediaTypeIcon: Record<string, string> = {
  image: 'bi-image',
  video: 'bi-camera-video',
  document: 'bi-file-earmark-text',
  audio: 'bi-music-note-beamed',
};

const formatCount = (value: number) => new Intl.NumberFormat().format(value || 0);

const normalizeMediaType = (value?: string) => (value ? String(value).toLowerCase() : 'document');

const normalizeRecentMedia = (row: RecentMediaRow): RecentMedia => {
  const mediaType = normalizeMediaType(readString(row, 'media_type') || readString(row, 'mediaType'));
  const title = readString(row, 'title') || readString(row, 'file_name') || 'Untitled memory';

  return {
    id: String(row.id || ''),
    title,
    fileName: readString(row, 'file_name') || '',
    mediaType,
    collection: readString(row, 'collection_name') || readString(row, 'collection'),
    captureDate: readString(row, 'capture_date'),
    createdAt: readString(row, 'created_at'),
    thumbnailUrl: readString(row, 'thumbnail_url'),
    fileUrl: readString(row, 'file_url'),
  };
};

const getDateLabel = (item: RecentMedia) => {
  const dateValue = item.captureDate || item.createdAt;
  if (!dateValue) return 'Recently added';

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue).split('T')[0];

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
};

const getImagePreview = (item: RecentMedia) => {
  if (item.mediaType !== 'image') return undefined;
  return item.thumbnailUrl || item.fileUrl;
};

const HomePage = () => {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [recentUploads, setRecentUploads] = useState<RecentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardSummary, recent] = await Promise.all([
          window.electronAPI.getDashboardSummary(),
          window.electronAPI.searchMedia({ sort: 'newest', limit: 8, offset: 0 }),
        ]);

        if (!isMounted) return;

        setSummary({ ...defaultSummary, ...dashboardSummary });
        setRecentUploads((recent || []).map(normalizeRecentMedia));
      } catch (err) {
        console.error('Error loading dashboard', err);
        if (isMounted) {
          setError('We could not load your dashboard right now. You can still upload or search your vault.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const mediaBreakdown = useMemo(
    () => [
      { label: 'Images', value: summary.mediaTypeCounts.image || 0, icon: 'bi-image' },
      { label: 'Documents', value: summary.mediaTypeCounts.document || 0, icon: 'bi-file-earmark-text' },
      { label: 'Videos', value: summary.mediaTypeCounts.video || 0, icon: 'bi-camera-video' },
      { label: 'Audio', value: summary.mediaTypeCounts.audio || 0, icon: 'bi-music-note-beamed' },
    ],
    [summary.mediaTypeCounts]
  );

  const hasMedia = summary.totalMedia > 0 || recentUploads.length > 0;

  return (
    <Container fluid className="home-dashboard px-0">
      <section className="home-hero shadow-sm">
        <Row className="align-items-center g-4">
          <Col lg={7}>
            <Badge bg="light" text="dark" className="home-hero__badge mb-3">
              <i className="bi bi-shield-lock me-2" aria-hidden="true" />
              Local-first family archive
            </Badge>
            <h1 className="home-hero__title">Preserve every memory in your private vault.</h1>
            <p className="home-hero__copy">
              Preserve your family photos, documents, and videos in a private vault stored right on your own
              drive. Memory Vault keeps your archive organized, searchable, and available offline.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/upload" className="btn btn-warning home-hero__primary-btn">
                <i className="bi bi-cloud-arrow-up me-2" aria-hidden="true" />
                Upload Media
              </Link>
              <Link to="/search" className="btn btn-outline-light home-hero__secondary-btn">
                <i className="bi bi-search me-2" aria-hidden="true" />
                Search Vault
              </Link>
            </div>
          </Col>
          <Col lg={5}>
            <Card className="home-hero__panel border-0">
              <Card.Body>
                <div className="home-hero__panel-icon">
                  <i className="bi bi-hdd-stack" aria-hidden="true" />
                </div>
                <h2>Your memories stay close.</h2>
                <p>
                  Files are archived locally and connected to searchable metadata, collections, people, and tags.
                </p>
                <div className="home-hero__trust-row">
                  <span><i className="bi bi-wifi-off me-1" aria-hidden="true" />Offline ready</span>
                  <span><i className="bi bi-lock me-1" aria-hidden="true" />Private by design</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      {error && <Alert variant="warning" className="mt-4 mb-0">{error}</Alert>}

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <p className="home-section__eyebrow">Start here</p>
            <h2>Quick actions</h2>
          </div>
          <p className="home-section__hint">Jump into the most common Memory Vault workflows.</p>
        </div>

        <Row className="g-3">
          <Col md={6} xl={3}>
            <Card className="home-action-card h-100">
              <Card.Body>
                <span className="home-action-card__icon home-action-card__icon--gold">
                  <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
                </span>
                <Card.Title>Upload Media</Card.Title>
                <Card.Text>Add photos, videos, documents, and details to your offline archive.</Card.Text>
                <Link to="/upload" className="btn btn-warning mt-auto align-self-start">
                  Add memories
                </Link>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} xl={3}>
            <Card className="home-action-card h-100">
              <Card.Body>
                <span className="home-action-card__icon">
                  <i className="bi bi-search" aria-hidden="true" />
                </span>
                <Card.Title>Search Vault</Card.Title>
                <Card.Text>Find memories by title, dates, people, tags, locations, or collections.</Card.Text>
                <Link to="/search" className="btn btn-primary mt-auto align-self-start">
                  Search now
                </Link>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} xl={3}>
            <Card className="home-action-card h-100">
              <Card.Body>
                <span className="home-action-card__icon home-action-card__icon--teal">
                  <i className="bi bi-collection" aria-hidden="true" />
                </span>
                <Card.Title>Browse Collections</Card.Title>
                <Card.Text>Use search filters to review everything grouped by collection.</Card.Text>
                <Link to="/search" className="btn btn-outline-primary mt-auto align-self-start">
                  Open collections
                </Link>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} xl={3}>
            <Card className="home-action-card home-action-card--disabled h-100">
              <Card.Body>
                <span className="home-action-card__icon home-action-card__icon--muted">
                  <i className="bi bi-people" aria-hidden="true" />
                </span>
                <Card.Title>People & Tags</Card.Title>
                <Card.Text>Dedicated people and tag browsing is coming soon. Search filters work today.</Card.Text>
                <Link to="/search" className="btn btn-outline-secondary mt-auto align-self-start">
                  Browse in search
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <p className="home-section__eyebrow">Vault health</p>
            <h2>Dashboard stats</h2>
          </div>
          {loading && <Spinner animation="border" role="status" size="sm" className="text-primary" />}
        </div>

        <Row className="g-3">
          <Col sm={6} xl={3}>
            <Card className="home-stat-card">
              <Card.Body>
                <span className="home-stat-card__label">Media items</span>
                <strong>{formatCount(summary.totalMedia)}</strong>
                <i className="bi bi-archive" aria-hidden="true" />
              </Card.Body>
            </Card>
          </Col>
          <Col sm={6} xl={3}>
            <Card className="home-stat-card">
              <Card.Body>
                <span className="home-stat-card__label">Collections</span>
                <strong>{formatCount(summary.collectionsCount)}</strong>
                <i className="bi bi-collection" aria-hidden="true" />
              </Card.Body>
            </Card>
          </Col>
          <Col sm={6} xl={3}>
            <Card className="home-stat-card">
              <Card.Body>
                <span className="home-stat-card__label">People</span>
                <strong>{formatCount(summary.peopleCount)}</strong>
                <i className="bi bi-person-heart" aria-hidden="true" />
              </Card.Body>
            </Card>
          </Col>
          <Col sm={6} xl={3}>
            <Card className="home-stat-card">
              <Card.Body>
                <span className="home-stat-card__label">Tags</span>
                <strong>{formatCount(summary.tagsCount)}</strong>
                <i className="bi bi-tags" aria-hidden="true" />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3 mt-1">
          {mediaBreakdown.map((item) => (
            <Col sm={6} lg={3} key={item.label}>
              <div className="home-breakdown-pill">
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
                <strong>{formatCount(item.value)}</strong>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      <section className="home-section home-recent-section">
        <div className="home-section__heading">
          <div>
            <p className="home-section__eyebrow">Latest additions</p>
            <h2>Recent uploads</h2>
          </div>
          {hasMedia && (
            <Link to="/search" className="home-view-all-link">
              View all <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          )}
        </div>

        {!loading && !hasMedia ? (
          <Card className="home-empty-state border-0">
            <Card.Body>
              <div className="home-empty-state__icon">
                <i className="bi bi-images" aria-hidden="true" />
              </div>
              <h3>Your vault is ready for its first memory.</h3>
              <p>
                Upload family photos, scanned documents, or home videos to start building a private archive that is
                searchable and stored locally on your drive.
              </p>
              <Link to="/upload" className="btn btn-warning home-hero__primary-btn">
                Upload your first media
              </Link>
            </Card.Body>
          </Card>
        ) : (
          <div className="home-recent-grid" aria-live="polite">
            {loading && recentUploads.length === 0
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card className="home-recent-card home-recent-card--skeleton" key={index}>
                    <div className="home-recent-card__preview" />
                    <Card.Body>
                      <span />
                      <strong />
                    </Card.Body>
                  </Card>
                ))
              : recentUploads.map((item) => {
                  const preview = getImagePreview(item);
                  const icon = mediaTypeIcon[item.mediaType] || 'bi-file-earmark';

                  return (
                    <Card className="home-recent-card" key={item.id}>
                      <div className="home-recent-card__preview">
                        {preview ? (
                          <img src={preview} alt={item.title} loading="lazy" />
                        ) : (
                          <div className="home-recent-card__placeholder">
                            <i className={`bi ${icon}`} aria-hidden="true" />
                            <span>{item.mediaType}</span>
                          </div>
                        )}
                      </div>
                      <Card.Body>
                        <div className="home-recent-card__meta">
                          <Badge bg="light" text="dark">{item.collection || 'Unfiled'}</Badge>
                          <span>{getDateLabel(item)}</span>
                        </div>
                        <Card.Title>{item.title}</Card.Title>
                        <Link to={`/media/${item.id}`} className="btn btn-outline-primary btn-sm">
                          Open memory
                        </Link>
                      </Card.Body>
                    </Card>
                  );
                })}
          </div>
        )}
      </section>
    </Container>
  );
};

export default HomePage;
