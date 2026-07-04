declare module 'electron-updater' {
  import { EventEmitter } from 'events';

  export type UpdateInfo = {
    version: string;
    releaseName?: string | null;
    releaseDate?: string;
  };

  export type ProgressInfo = {
    percent: number;
    transferred: number;
    total: number;
    bytesPerSecond: number;
  };

  type Updater = EventEmitter & {
    autoDownload: boolean;
    autoInstallOnAppQuit: boolean;
    allowPrerelease: boolean;
    allowDowngrade: boolean;
    checkForUpdates: () => Promise<unknown>;
    downloadUpdate: () => Promise<unknown>;
    quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void;
    on(event: 'checking-for-update', listener: () => void): Updater;
    on(event: 'update-available' | 'update-not-available' | 'update-downloaded', listener: (info: UpdateInfo) => void): Updater;
    on(event: 'download-progress', listener: (progress: ProgressInfo) => void): Updater;
    on(event: 'error', listener: (error: Error) => void): Updater;
  };

  export const autoUpdater: Updater;
}
