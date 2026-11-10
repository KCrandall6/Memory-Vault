// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./storage-root.d.ts" />
import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';
// @ts-expect-error - CommonJS helper declaration is not resolved by bundler mode
import storageRoot from './storage-root.cjs';

const require = createRequire(import.meta.url);
let updater: typeof import('electron-updater').autoUpdater | undefined;

function isStoreBuild() {
  if (process.windowsStore) return true;
  // AppX uses regular Electron, so do not rely on windowsStore alone.
  return require(path.join(app.getAppPath(), 'package.json')).memoryVaultDistribution === 'store';
}

function getAutoUpdater() {
  if (!isSupported()) throw new Error(unsupportedMessage());
  if (!updater) {
    const { autoUpdater } = require('electron-updater') as typeof import('electron-updater');
    updater = autoUpdater;
  }
  return updater;
}

const { readSettings, writeSettings } = storageRoot;

const UPDATE_CHANNELS = {
  getState: 'updates:get-state',
  check: 'updates:check',
  download: 'updates:download',
  quitAndInstall: 'updates:quit-and-install',
  stateChanged: 'updates:state-changed'
} as const;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 12_000;

type UpdateStatus = 'unsupported' | 'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'downloaded' | 'error';

export type UpdateState = {
  status: UpdateStatus;
  supported: boolean;
  currentVersion: string;
  availableVersion?: string;
  releaseName?: string | null;
  releaseDate?: string;
  lastCheckedAt?: string;
  nextAutomaticCheckAt?: string;
  progress?: {
    percent: number;
    transferred: number;
    total: number;
    bytesPerSecond: number;
  };
  error?: string;
};

type UpdateSettings = { lastUpdateCheckAt?: string; [key: string]: unknown };

let state: UpdateState;
let listenersRegistered = false;
let handlersRegistered = false;
let checkInFlight: Promise<UpdateState> | null = null;
let downloadInFlight: Promise<UpdateState> | null = null;
let downloaded = false;
let startupTimer: NodeJS.Timeout | null = null;
let mainWindow: BrowserWindow | null = null;

function isPortableBuild() {
  return Boolean(process.env.PORTABLE_EXECUTABLE_FILE || process.env.PORTABLE_EXECUTABLE_DIR || process.env.PORTABLE_EXECUTABLE_APP_FILENAME);
}

function isSupported() {
  return app.isPackaged && process.platform === 'win32' && !isStoreBuild() && !isPortableBuild();
}

function readUpdateSettings(): UpdateSettings {
  return readSettings() as UpdateSettings;
}

function nextCheck(lastCheckedAt?: string) {
  if (!lastCheckedAt) return undefined;
  const time = Date.parse(lastCheckedAt);
  if (!Number.isFinite(time)) return undefined;
  return new Date(time + WEEK_MS).toISOString();
}

function makeInitialState(): UpdateState {
  const settings = readUpdateSettings();
  const supported = isSupported();
  return {
    status: supported ? 'idle' : 'unsupported',
    supported,
    currentVersion: app.getVersion(),
    lastCheckedAt: supported ? settings.lastUpdateCheckAt : undefined,
    nextAutomaticCheckAt: supported ? nextCheck(settings.lastUpdateCheckAt) : undefined,
    error: supported ? undefined : unsupportedMessage()
  };
}

function unsupportedMessage() {
  if (isStoreBuild()) return 'This package uses Microsoft Store updates. Local test packages must be updated by installing a newer test package. GitHub updates are disabled.';
  if (!app.isPackaged) return 'Real update checks are available only in an installed Windows build.';
  if (process.platform !== 'win32') return 'Automatic updates are available only for installed Windows builds.';
  if (isPortableBuild()) return 'Portable builds should be updated manually by downloading the latest portable package.';
  return 'Automatic updates are not supported in this build.';
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown update error.');
  if (/token|authorization|password|secret|bearer/i.test(message)) return 'Memory Vault could not check for updates. Please try again later.';
  return message.replace(/https?:\/\/[^\s)]+/g, 'the update server').slice(0, 240);
}

function serializeInfo(info: UpdateInfo) {
  return {
    availableVersion: info.version,
    releaseName: info.releaseName ?? null,
    releaseDate: info.releaseDate
  };
}

function setState(patch: Partial<UpdateState>) {
  state = { ...state, ...patch, currentVersion: app.getVersion(), supported: isSupported() };
  if (state.lastCheckedAt) state.nextAutomaticCheckAt = nextCheck(state.lastCheckedAt);
  BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(UPDATE_CHANNELS.stateChanged, state));
  return state;
}

function persistCheckStarted() {
  const lastCheckedAt = new Date().toISOString();
  const settings = readUpdateSettings();
  writeSettings({ ...settings, lastUpdateCheckAt: lastCheckedAt });
  setState({ lastCheckedAt, nextAutomaticCheckAt: nextCheck(lastCheckedAt) });
}

function configureAutoUpdater() {
  const autoUpdater = getAutoUpdater();
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
}

function registerListeners() {
  if (listenersRegistered || !isSupported()) return;
  const autoUpdater = getAutoUpdater();
  listenersRegistered = true;
  autoUpdater.on('checking-for-update', () => setState({ status: 'checking', error: undefined, progress: undefined }));
  autoUpdater.on('update-available', (info) => setState({ status: 'available', ...serializeInfo(info), error: undefined, progress: undefined }));
  autoUpdater.on('update-not-available', () => setState({ status: 'up-to-date', error: undefined, progress: undefined }));
  autoUpdater.on('download-progress', (progress: ProgressInfo) => setState({
    status: 'downloading',
    progress: {
      percent: Math.max(0, Math.min(100, progress.percent || 0)),
      transferred: progress.transferred || 0,
      total: progress.total || 0,
      bytesPerSecond: progress.bytesPerSecond || 0
    },
    error: undefined
  }));
  autoUpdater.on('update-downloaded', (info) => {
    downloaded = true;
    setState({ status: 'downloaded', ...serializeInfo(info), progress: undefined, error: undefined });
  });
  autoUpdater.on('error', (error) => {
    console.warn('Update service error:', sanitizeError(error));
    setState({ status: 'error', error: sanitizeError(error), progress: undefined });
  });
}

function assertSupported() {
  if (!isSupported()) return setState({ status: 'unsupported', error: unsupportedMessage() });
  return null;
}

function validateSender(event: IpcMainInvokeEvent) {
  const url = event.senderFrame?.url || event.sender.getURL();
  if (!url) throw new Error('Updater request rejected: unknown sender.');
  if (!app.isPackaged) {
    const allowed = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173';
    if (new URL(url).origin !== new URL(allowed).origin) throw new Error('Updater request rejected: unexpected development origin.');
    return;
  }
  if (new URL(url).protocol !== 'file:') throw new Error('Updater request rejected: unexpected packaged renderer URL.');
}

async function checkForUpdates(manual: boolean) {
  const unsupported = assertSupported();
  if (unsupported) return unsupported;
  if (checkInFlight) return checkInFlight;
  if (!manual && state.lastCheckedAt && Date.now() < Date.parse(state.lastCheckedAt) + WEEK_MS) return state;
  persistCheckStarted();
  checkInFlight = getAutoUpdater().checkForUpdates()
    .then(() => state)
    .catch((error) => setState({ status: 'error', error: sanitizeError(error), progress: undefined }))
    .finally(() => { checkInFlight = null; });
  return checkInFlight;
}

async function downloadUpdate() {
  const unsupported = assertSupported();
  if (unsupported) return unsupported;
  if (downloadInFlight) return downloadInFlight;
  if (state.status !== 'available') return setState({ error: 'No downloaded update is available to install yet.' });
  downloadInFlight = getAutoUpdater().downloadUpdate()
    .then(() => state)
    .catch((error) => setState({ status: 'error', error: sanitizeError(error), progress: undefined }))
    .finally(() => { downloadInFlight = null; });
  setState({ status: 'downloading', progress: { percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 }, error: undefined });
  return downloadInFlight;
}

function quitAndInstall() {
  const unsupported = assertSupported();
  if (unsupported) return { success: false, error: unsupported.error };
  if (!downloaded || state.status !== 'downloaded') return { success: false, error: 'The update has not finished downloading yet.' };
  getAutoUpdater().quitAndInstall(false, true);
  return { success: true };
}

export function getUpdateState() {
  if (!state) state = makeInitialState();
  return state;
}

export function setupUpdater(options: { getMainWindow: () => BrowserWindow | null }) {
  mainWindow = options.getMainWindow();
  state = makeInitialState();
  if (isSupported()) configureAutoUpdater();
  registerListeners();

  if (!handlersRegistered) {
    handlersRegistered = true;
    ipcMain.handle(UPDATE_CHANNELS.getState, (event) => { validateSender(event); return getUpdateState(); });
    ipcMain.handle(UPDATE_CHANNELS.check, (event) => { validateSender(event); return checkForUpdates(true); });
    ipcMain.handle(UPDATE_CHANNELS.download, (event) => { validateSender(event); return downloadUpdate(); });
    ipcMain.handle(UPDATE_CHANNELS.quitAndInstall, (event) => { validateSender(event); return quitAndInstall(); });
  }
}

export function scheduleAutomaticUpdateCheck() {
  if (!isSupported() || startupTimer) return;
  startupTimer = setTimeout(() => {
    mainWindow = mainWindow && !mainWindow.isDestroyed() ? mainWindow : BrowserWindow.getAllWindows()[0] || null;
    checkForUpdates(false).catch((error) => console.warn('Automatic update check failed:', sanitizeError(error)));
  }, STARTUP_DELAY_MS);
}
