import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import RecentMediaCard from '../components/recent/RecentMediaCard';
import { normalizeRecentMedia, RecentMediaItem } from '../components/recent/recentMedia';
import { DetailedMedia } from '../components/search/DetailsModal';
import { useMemoryDetails } from '../hooks/useMemoryDetails';
import './HomePage.css';

const PAGE_SIZE = 25;

const RecentUploadsPage = () => {
  const [items, setItems] = useState<RecentMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const handleSavedMemory = useCallback((media: DetailedMedia) => {
    setItems((prev) => prev.map((item) => (item.id === media.id ? normalizeRecentMedia(media as unknown as Record<string, unknown>) : item)));
  }, []);

  const handleDeletedMemory = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const { openMemory, detailsModal } = useMemoryDetails({ onSaved: handleSavedMemory, onDeleted: handleDeletedMemory });

  const loadRecent = useCallback(async (offset = 0) => {
    const isInitial = offset === 0;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const rows = await window.electronAPI.searchMedia({ sort: 'uploaded', limit: PAGE_SIZE, offset });
      const normalized = (rows || []).map(normalizeRecentMedia);
      setItems((prev) => (isInitial ? normalized : [...prev, ...normalized]));
      setHasMore(normalized.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading recent uploads', err);
      setError('Unable to load recent uploads right now.');
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadRecent(0);
  }, [loadRecent]);

  const isEmpty = !loading && items.length === 0;

  return (
    <Container fluid className="home-dashboard px-0 recent-uploads-page">
      <section className="home-section mt-0">
        <div className="home-section__heading">
          <div>
            <p className="home-section__eyebrow">Newest first</p>
            <h1 className="mb-1">Recent Uploads</h1>
            <p className="home-section__hint text-start">
              Browse your latest memories by upload date.
            </p>
          </div>
          <Link to="/" className="home-view-all-link">
            <i className="bi bi-arrow-left" aria-hidden="true" /> Back home
          </Link>
        </div>

        {error && <Alert variant="warning">{error}</Alert>}

        {loading ? (
          <div className="home-recent-grid" aria-live="polite">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card className="home-recent-card home-recent-card--skeleton" key={index}>
                <div className="home-recent-card__preview" />
                <Card.Body>
                  <span />
                  <strong />
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : isEmpty ? (
          <Card className="home-empty-state border-0">
            <Card.Body>
              <div className="home-empty-state__icon">
                <i className="bi bi-images" aria-hidden="true" />
              </div>
              <h3>No recent uploads yet.</h3>
              <p>Upload photos, documents, audio, or videos to start building your Memory Vault timeline.</p>
              <Link to="/upload" className="btn btn-warning home-hero__primary-btn">
                Upload media
              </Link>
            </Card.Body>
          </Card>
        ) : (
          <>
            <div className="home-recent-grid" aria-live="polite">
              {items.map((item) => (
                <RecentMediaCard key={item.id} item={item} onOpen={openMemory} />
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-4">
                <Button
                  variant="outline-primary"
                  className="px-4"
                  onClick={() => loadRecent(items.length)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" /> Loading…
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      {detailsModal}
    </Container>
  );
};

export default RecentUploadsPage;
