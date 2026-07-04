import { useMemo, useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { UpdateProvider } from '../../updates/UpdateContext';
import { useUpdates } from '../../updates/useUpdates';
import './Layout.css';

function UpdateNotice() {
  const navigate = useNavigate();
  const { state, quitAndInstallUpdate } = useUpdates();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const notice = useMemo(() => {
    if (!state || !state.supported) return null;
    if (state.status !== 'available' && state.status !== 'downloaded') return null;
    const version = state.availableVersion || state.releaseName || 'a new version';
    return {
      key: `${state.status}-${version}`,
      version,
      downloaded: state.status === 'downloaded'
    };
  }, [state]);

  if (!notice || dismissedKey === notice.key) return null;

  const handlePrimaryAction = async () => {
    if (notice.downloaded) {
      const confirmed = window.confirm('Memory Vault will close, install the update, and reopen. Your Memory Vault Library is stored separately and will not be removed. Continue?');
      if (confirmed) await quitAndInstallUpdate();
      return;
    }
    navigate('/settings#application-updates');
  };

  return (
    <div className="app-update-notice" role="status" aria-live="polite">
      <div>
        <strong>{notice.downloaded ? `Memory Vault ${notice.version} is ready to install.` : `Memory Vault ${notice.version} is available.`}</strong>
        <span>Updates are downloaded and installed only with your permission.</span>
      </div>
      <div className="app-update-notice__actions">
        <Button size="sm" onClick={handlePrimaryAction}>{notice.downloaded ? 'Restart and install' : 'View update'}</Button>
        <Button size="sm" variant="link" onClick={() => setDismissedKey(notice.key)}>Dismiss</Button>
      </div>
    </div>
  );
}

const Layout = () => {
  return (
    <UpdateProvider>
      <div className="app-layout d-flex flex-column vh-100 w-100">
        <Navbar />
        <UpdateNotice />
        <main className="app-main flex-grow-1 w-100">
          <Container fluid className="app-content-container py-4">
            <Outlet />
          </Container>
        </main>
      </div>
    </UpdateProvider>
  );
};

export default Layout;
