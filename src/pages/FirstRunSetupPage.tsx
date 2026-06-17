import { useState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import './FirstRunSetupPage.css';

type FirstRunSetupPageProps = {
  onLibraryReady: () => void;
};

function FirstRunSetupPage({ onLibraryReady }: FirstRunSetupPageProps) {
  const [busyAction, setBusyAction] = useState<'create' | 'open' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chooseLibrary = async (action: 'create' | 'open') => {
    setBusyAction(action);
    setError(null);

    try {
      const result = action === 'create'
        ? await window.electronAPI.chooseCreateNewLibrary()
        : await window.electronAPI.chooseOpenExistingLibrary();

      if (result.canceled) return;
      if (!result.success) {
        throw new Error(result.error || 'Unable to prepare your Memory Vault Library.');
      }

      onLibraryReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to prepare your Memory Vault Library.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <main className="first-run-setup">
      <Card className="first-run-setup__card">
        <Card.Body>
          <div className="first-run-setup__icon"><i className="bi bi-archive" /></div>
          <h1>Welcome to Memory Vault</h1>
          <p className="first-run-setup__lead">
            Choose where you want to keep your Memory Vault Library. This is where your memories and details will be stored.
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          <div className="first-run-setup__actions">
            <Button size="lg" onClick={() => chooseLibrary('create')} disabled={busyAction !== null}>
              {busyAction === 'create' ? <Spinner size="sm" /> : <i className="bi bi-folder-plus" />}
              Create a New Library
            </Button>
            <Button size="lg" variant="outline-primary" onClick={() => chooseLibrary('open')} disabled={busyAction !== null}>
              {busyAction === 'open' ? <Spinner size="sm" /> : <i className="bi bi-folder2-open" />}
              Open an Existing Library
            </Button>
          </div>

          <p className="first-run-setup__note">
            Your Memory Vault Library is separate from the Memory Vault app, so your family archive can stay safe when the app is installed or updated.
          </p>
        </Card.Body>
      </Card>
    </main>
  );
}

export default FirstRunSetupPage;
