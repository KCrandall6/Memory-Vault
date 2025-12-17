// electron/file-handler.d.ts
declare module './file-handler.js' {
  export function getAppDataPath(): string;

  export function ensureDirectoriesExist(): Promise<{
    mediaDir: string;
  }>;

  export function processMediaFile(
    filePath: string,
    fileName: string
  ): Promise<{
    filePath: string;
    fileName: string;
    relativePath: string;
    thumbnail: null;
  }>;
}

export {};