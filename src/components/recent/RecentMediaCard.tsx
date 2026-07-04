import { useEffect, useState } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { getDateLabel, getPreviewCandidate, mediaTypeIcon, RecentMediaItem } from './recentMedia';

type RecentMediaCardProps = {
  item: RecentMediaItem;
  onOpen: (item: RecentMediaItem) => void;
};

const RecentMediaCard = ({ item, onOpen }: RecentMediaCardProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const candidate = getPreviewCandidate(item);
    setPreviewUrl(undefined);
    setPreviewFailed(false);

    if (!candidate) return;

    if (candidate.startsWith('data:') || !window.electronAPI?.getFilePreview) {
      setPreviewUrl(candidate);
      return;
    }

    window.electronAPI
      .getFilePreview(candidate)
      .then((preview) => {
        if (!cancelled) setPreviewUrl(preview?.dataUrl || candidate);
      })
      .catch((err) => {
        console.warn('Error resolving recent upload preview', err);
        if (!cancelled) setPreviewUrl(candidate);
      });

    return () => {
      cancelled = true;
    };
  }, [item]);

  const shouldShowPreview = Boolean(previewUrl && !previewFailed);
  const icon = mediaTypeIcon[item.mediaType] || mediaTypeIcon.unknown;

  return (
    <Card className="home-recent-card" key={item.id}>
      <div className="home-recent-card__preview">
        {shouldShowPreview ? (
          <img
            src={previewUrl}
            alt={item.title}
            loading="lazy"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <div className="home-recent-card__placeholder">
            <i className={`bi ${icon}`} aria-hidden="true" />
            <span>{item.mediaType}</span>
          </div>
        )}
      </div>
      <Card.Body>
        <Card.Title>{item.title}</Card.Title>
        <div className="home-recent-card__meta">
          <Badge bg="light" text="dark">{item.collection || 'Unfiled'}</Badge>
          <span>{getDateLabel(item)}</span>
        </div>
        <Button variant="outline-primary" size="sm" onClick={() => onOpen(item)}>
          Open memory
        </Button>
      </Card.Body>
    </Card>
  );
};

export default RecentMediaCard;
