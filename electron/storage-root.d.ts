declare module './storage-root.cjs' {
  export const ARCHIVE_FOLDER_NAME: string;
  export const DATABASE_FILENAME: string;
  export function resolveStorageRoot(): string;
  export function ensureStorageRoot(): string;
  export function ensureArchiveDirectory(): string;
  export function getDatabasePath(): string;
  export function resolveArchiveFilePath(relativePath: string): string | null;

  const storageRoot: {
    ARCHIVE_FOLDER_NAME: string;
    DATABASE_FILENAME: string;
    resolveStorageRoot: () => string;
    ensureStorageRoot: () => string;
    ensureArchiveDirectory: () => string;
    getDatabasePath: () => string;
    resolveArchiveFilePath: (relativePath: string) => string | null;
  };

  export = storageRoot;
}