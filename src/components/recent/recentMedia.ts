export type MediaKind = 'image' | 'video' | 'document' | 'audio' | 'unknown';

export type RecentMediaRow = Record<string, unknown>;

export type RecentMediaItem = {
  id: string;
  title: string;
  fileName: string;
  mediaType: MediaKind;
  mediaTypeId?: number;
  collection?: string;
  captureDate?: string;
  createdAt?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
};

export const mediaTypeIcon: Record<MediaKind, string> = {
  image: 'bi-image',
  video: 'bi-camera-video',
  document: 'bi-file-earmark-text',
  audio: 'bi-music-note-beamed',
  unknown: 'bi-file-earmark',
};

const mediaTypeIdFallback: Record<number, MediaKind> = {
  1: 'image',
  2: 'video',
  3: 'document',
  4: 'audio',
};

const extensionKind: Record<string, MediaKind> = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  heic: 'image',
  heif: 'image',
  svg: 'image',
  tif: 'image',
  tiff: 'image',
  bmp: 'image',
  mp4: 'video',
  mov: 'video',
  m4v: 'video',
  avi: 'video',
  webm: 'video',
  mkv: 'video',
  mpg: 'video',
  mpeg: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  aac: 'audio',
  flac: 'audio',
  ogg: 'audio',
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  txt: 'document',
  rtf: 'document',
  csv: 'document',
  xls: 'document',
  xlsx: 'document',
};

export const readString = (row: RecentMediaRow, key: string) => {
  const value = row[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const readNumber = (row: RecentMediaRow, key: string) => {
  const value = row[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const isSafePreviewUrl = (value?: string) => Boolean(value && /^(data:|blob:|file:\/\/|https?:\/\/)/i.test(value));

const extractExtension = (value?: string) => value?.split(/[?#]/)[0].split('.').pop()?.toLowerCase();

export const inferMediaType = (row: RecentMediaRow): MediaKind => {
  const typedText = [
    readString(row, 'media_type'),
    readString(row, 'mediaType'),
    readString(row, 'mime_type'),
    readString(row, 'mimeType'),
    readString(row, 'type'),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (typedText.includes('image')) return 'image';
  if (typedText.includes('video')) return 'video';
  if (typedText.includes('audio')) return 'audio';

  const extensionCandidate = [
    readString(row, 'file_name'),
    readString(row, 'fileName'),
    readString(row, 'file_path'),
    readString(row, 'filePath'),
    readString(row, 'file_url'),
    readString(row, 'fileUrl'),
    readString(row, 'thumbnail_url'),
    readString(row, 'thumbnailUrl'),
  ]
    .map(extractExtension)
    .find((extension): extension is string => Boolean(extension && extensionKind[extension]));

  if (extensionCandidate) return extensionKind[extensionCandidate];

  const mediaTypeId = readNumber(row, 'media_type_id') || readNumber(row, 'mediaTypeId');
  if (mediaTypeId && mediaTypeIdFallback[mediaTypeId]) return mediaTypeIdFallback[mediaTypeId];

  if (typedText.includes('document') || typedText.includes('pdf') || typedText.includes('text')) return 'document';

  return 'unknown';
};

export const normalizeRecentMedia = (row: RecentMediaRow): RecentMediaItem => {
  const title = readString(row, 'title') || readString(row, 'file_name') || readString(row, 'fileName') || 'Untitled memory';
  const thumbnailUrl = readString(row, 'thumbnail_url') || readString(row, 'thumbnailUrl') || readString(row, 'thumbnail');
  const fileUrl = readString(row, 'file_url') || readString(row, 'fileUrl');
  const mediaTypeId = readNumber(row, 'media_type_id') || readNumber(row, 'mediaTypeId');

  return {
    id: String(row.id || ''),
    title,
    fileName: readString(row, 'file_name') || readString(row, 'fileName') || '',
    mediaType: inferMediaType(row),
    mediaTypeId,
    collection: readString(row, 'collection_name') || readString(row, 'collection') || 'Ungrouped Memories',
    captureDate: readString(row, 'capture_date') || readString(row, 'captureDate'),
    createdAt: readString(row, 'created_at') || readString(row, 'createdAt'),
    thumbnailUrl: isSafePreviewUrl(thumbnailUrl) ? thumbnailUrl : undefined,
    fileUrl: isSafePreviewUrl(fileUrl) ? fileUrl : undefined,
  };
};

export const getDateLabel = (item: RecentMediaItem) => {
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

export const getPreviewCandidate = (item: RecentMediaItem) => {
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.mediaType === 'image') return item.fileUrl;
  return undefined;
};
