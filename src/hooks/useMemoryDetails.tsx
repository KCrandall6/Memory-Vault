import { useCallback, useEffect, useState } from 'react';
import DetailsModal, { DetailedMedia } from '../components/search/DetailsModal';
import { ReferenceOption } from '../components/search/SearchBar';
import { RecentMediaItem } from '../components/recent/recentMedia';

type ReferenceRow = { id: number | string; name: string };

type UseMemoryDetailsOptions = {
  onSaved?: (media: DetailedMedia) => void;
  onDeleted?: (id: string) => void;
};

const mapReference = (items: ReferenceRow[] = []): ReferenceOption[] =>
  items.map((item) => ({ id: String(item.id), name: item.name }));

export const normalizeDetailedMedia = (row: Record<string, unknown>): DetailedMedia => ({
  id: String(row.id),
  title: String(row.title || row.file_name || 'Untitled memory'),
  description: String(row.description || ''),
  captureDate: String(row.capture_date || row.captureDate || ''),
  uploadDate: row.created_at ? String(row.created_at).split('T')[0] : String(row.uploadDate || ''),
  location: String(row.location || ''),
  collection: String(row.collection_name || row.collection || 'Ungrouped Memories'),
  mediaType: row.media_type ? String(row.media_type).toLowerCase() : String(row.mediaType || 'unknown').toLowerCase(),
  mediaTypeId: typeof row.media_type_id === 'number' ? row.media_type_id : Number(row.mediaTypeId) || undefined,
  tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
  people: Array.isArray(row.people) ? row.people.map(String) : [],
  thumbnail: row.thumbnail_url ? String(row.thumbnail_url) : row.thumbnail ? String(row.thumbnail) : undefined,
  filePath: row.file_path ? String(row.file_path) : row.filePath ? String(row.filePath) : undefined,
  fileUrl: row.file_url ? String(row.file_url) : row.fileUrl ? String(row.fileUrl) : undefined,
});

export const useMemoryDetails = ({ onSaved, onDeleted }: UseMemoryDetailsOptions = {}) => {
  const [availableMediaTypes, setAvailableMediaTypes] = useState<ReferenceOption[]>([]);
  const [availableCollections, setAvailableCollections] = useState<ReferenceOption[]>([]);
  const [availablePeople, setAvailablePeople] = useState<ReferenceOption[]>([]);
  const [availableTags, setAvailableTags] = useState<ReferenceOption[]>([]);
  const [selected, setSelected] = useState<DetailedMedia | undefined>();
  const [showDetails, setShowDetails] = useState(false);

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
        console.warn('Error loading detail reference data', err);
      }
    };

    loadReferenceData();
  }, []);

  const openMemory = useCallback(async (item: RecentMediaItem | DetailedMedia) => {
    try {
      const details = await window.electronAPI.getMediaDetails(Number(item.id));
      let normalized = details ? normalizeDetailedMedia(details) : normalizeDetailedMedia(item as unknown as Record<string, unknown>);

      const previewCandidate = normalized.thumbnail || normalized.fileUrl || normalized.filePath;
      if (previewCandidate && window.electronAPI?.getFilePreview && !normalized.thumbnail?.startsWith('data:')) {
        try {
          const preview = await window.electronAPI.getFilePreview(previewCandidate);
          if (preview?.dataUrl) normalized = { ...normalized, thumbnail: preview.dataUrl };
        } catch (err) {
          console.warn('Error fetching detail preview', err);
        }
      }

      setSelected(normalized);
      setShowDetails(true);
    } catch (err) {
      console.error('Error loading media details', err);
      setSelected(normalizeDetailedMedia(item as unknown as Record<string, unknown>));
      setShowDetails(true);
    }
  }, []);

  const handleSaveDetails = useCallback(async (updated: DetailedMedia) => {
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
        mediaTypeId: updated.mediaTypeId,
      };
      const response = await window.electronAPI.updateMediaDetails(payload);
      if (response.success && response.media) {
        const normalized = normalizeDetailedMedia(response.media);
        setSelected(normalized);
        onSaved?.(normalized);
      }
    } catch (err) {
      console.error('Error saving media details', err);
    }
  }, [onSaved]);

  const handleDeleteDetails = useCallback(async (media: DetailedMedia) => {
    const response = await window.electronAPI.deleteMedia(Number(media.id));
    if (response.success) {
      setShowDetails(false);
      setSelected(undefined);
      onDeleted?.(media.id);
    }
  }, [onDeleted]);

  const detailsModal = (
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
  );

  return {
    openMemory,
    detailsModal,
    availableMediaTypes,
    availableCollections,
    availablePeople,
    availableTags,
  };
};
