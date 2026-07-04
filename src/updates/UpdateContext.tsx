import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { UpdateContext } from './updateContextValue';
import type { UpdateState } from './updateTypes';

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UpdateState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    window.electronAPI.getUpdateState()
      .then((next) => { if (active) setState(next); })
      .finally(() => { if (active) setLoading(false); });
    const unsubscribe = window.electronAPI.onUpdateStateChanged((next) => setState(next));
    return () => { active = false; unsubscribe(); };
  }, []);

  const checkForUpdates = useCallback(async () => {
    const next = await window.electronAPI.checkForUpdates();
    setState(next);
    return next;
  }, []);

  const downloadUpdate = useCallback(async () => {
    const next = await window.electronAPI.downloadUpdate();
    setState(next);
    return next;
  }, []);

  const quitAndInstallUpdate = useCallback(() => window.electronAPI.quitAndInstallUpdate(), []);

  const value = useMemo(() => ({ state, loading, checkForUpdates, downloadUpdate, quitAndInstallUpdate }), [state, loading, checkForUpdates, downloadUpdate, quitAndInstallUpdate]);
  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}
