import { createContext } from 'react';
import type { UpdateState } from './updateTypes';

export type UpdateContextValue = {
  state: UpdateState | null;
  loading: boolean;
  checkForUpdates: () => Promise<UpdateState | null>;
  downloadUpdate: () => Promise<UpdateState | null>;
  quitAndInstallUpdate: () => Promise<{ success: boolean; error?: string }>;
};

export const UpdateContext = createContext<UpdateContextValue | null>(null);
