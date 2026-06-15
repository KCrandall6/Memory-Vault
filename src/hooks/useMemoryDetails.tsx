import { useCallback, useEffect, useState } from 'react';
import DetailsModal, { DetailedMedia } from '../components/search/DetailsModal';
import { ReferenceOption } from '../components/search/SearchBar';
import { isRendererSafePreviewUrl, isSafePreviewUrl, RecentMediaItem } from '../components/recent/recentMedia';

type ReferenceRow = { id: number | string; name: string };

type UseMemoryDetailsOptions = {
  onSaved?: (media: DetailedMedia) => void;
  onDeleted?: (id: string) => void;
};

const mapReference = (items: ReferenceRow[] = []): ReferenceOption[] =>
  items.map((item) => ({ id: String(item.id), name: item.name }));

const readString = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
};

export const getSafePreviewSource = (media?: Pick<DetailedMedia, 'thumbnail' | 'fileUrl'>) => {
  if (!media) return undefined;
  if (media.thumbnail && isRendererSafePreviewUrl(media.thumbnail)) return media.thumbnail;
  if (media.fileUrl && isRendererSafePreviewUrl(media.fileUrl)) return media.fileUrl;
  return undefined;
};

export const resolveDetailPreview = async (media: DetailedMedia): Promise<DetailedMedia> => {
  const existingPreview = getSafePreviewSource(media);
  if (existingPreview) return media;

  const candidate = [media.thumbnail, media.fileUrl, media.filePath].find(Boolean);
  if (!candidate || !window.electronAPI?.getFilePreview) return media;

  try {
    const preview = await window.electronAPI.getFilePreview(candidate);
    if (preview?.dataUrl) {
      return { ...media, thumbnail: preview.dataUrl };
    }
  } catch (err) {
    console.warn('Error fetching detail preview', err);
  }

  return media;
};


export const normalizeDetailedMedia = (row: Record<string, unknown>): DetailedMedia => {
  const thumbnail = readString(row, 'thumbnail_url', 'thumbnailUrl', 'thumbnail');
  const fileUrl = readString(row, 'file_url', 'fileUrl');

  return {
    id: String(row.id),
    title: String(row.title || row.file_name || 'Untitled memory'),
    description: String(row.description || ''),
    notes: String(row.notes || ''),
    captureDate: String(row.capture_date || row.captureDate || ''),
    uploadDate: row.created_at ? String(row.created_at).split('T')[0] : String(row.uploadDate || ''),
    location: String(row.location || ''),
    collection: String(row.collection_name || row.collection || 'Ungrouped Memories'),
    mediaType: row.media_type ? String(row.media_type).toLowerCase() : String(row.mediaType || 'unknown').toLowerCase(),
    mediaTypeId: typeof row.media_type_id === 'number' ? row.media_type_id : Number(row.mediaTypeId) || undefined,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    people: Array.isArray(row.people) ? row.people.map(String) : [],
    thumbnail: thumbnail && isSafePreviewUrl(thumbnail) ? thumbnail : undefined,
    filePath: readString(row, 'file_path', 'filePath'),
    fileUrl: fileUrl && isSafePreviewUrl(fileUrl) ? fileUrl : undefined,
  };
};

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
      const normalized = await resolveDetailPreview(details ? normalizeDetailedMedia(details) : normalizeDetailedMedia(item as unknown as Record<string, unknown>));

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
        notes: updated.notes || '',
        captureDate: updated.captureDate,
        location: updated.location,
        collection: updated.collection,
        tags: updated.tags || [],
        people: updated.people || [],
        mediaTypeId: updated.mediaTypeId,
      };
      const response = await window.electronAPI.updateMediaDetails(payload);
      if (response.success && response.media) {
        const normalized = await resolveDetailPreview(normalizeDetailedMedia(response.media));
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
