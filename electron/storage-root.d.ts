declare module './storage-root.cjs' {
  export const ARCHIVE_FOLDER_NAME: string;
  export const DATABASE_FILENAME: string;
  export function resolveStorageRoot(): string;
  export function ensureStorageRoot(): string;
  export function ensureArchiveDirectory(): string;
  export function getDatabasePath(): string;
}