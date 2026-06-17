declare module './storage-root.cjs' {
  export const LIBRARY_FOLDER_NAME: string;
  export const ARCHIVE_FOLDER_NAME: string;
  export const DATABASE_FILENAME: string;
  export const SETTINGS_FILENAME: string;
  export function getSettingsPath(): string;
  export function readSettings(): { activeLibraryPath?: string; [key: string]: unknown };
  export function writeSettings(settings: { activeLibraryPath?: string; [key: string]: unknown }): void;
  export function looksLikeLibrary(libraryPath: string): boolean;
  export function getLegacyVaultCandidates(): string[];
  export function adoptLegacyLibraryIfPresent(): string | null;
  export function getActiveLibraryPath(options?: { adoptLegacy?: boolean }): string | null;
  export function setActiveLibraryPath(libraryPath: string): string;
  export function resolveStorageRoot(): string;
  export function ensureStorageRoot(): string;
  export function ensureArchiveDirectory(): string;
  export function getDatabasePath(): string;
  export function resolveArchiveFilePath(relativePath?: string | null): string | null;

  const storageRoot: {
    LIBRARY_FOLDER_NAME: string;
    ARCHIVE_FOLDER_NAME: string;
    DATABASE_FILENAME: string;
    SETTINGS_FILENAME: string;
    getSettingsPath: () => string;
    readSettings: () => { activeLibraryPath?: string; [key: string]: unknown };
    writeSettings: (settings: { activeLibraryPath?: string; [key: string]: unknown }) => void;
    looksLikeLibrary: (libraryPath: string) => boolean;
    getLegacyVaultCandidates: () => string[];
    adoptLegacyLibraryIfPresent: () => string | null;
    getActiveLibraryPath: (options?: { adoptLegacy?: boolean }) => string | null;
    setActiveLibraryPath: (libraryPath: string) => string;
    resolveStorageRoot: () => string;
    ensureStorageRoot: () => string;
    ensureArchiveDirectory: () => string;
    getDatabasePath: () => string;
    resolveArchiveFilePath: (relativePath?: string | null) => string | null;
  };

  export default storageRoot;
}
