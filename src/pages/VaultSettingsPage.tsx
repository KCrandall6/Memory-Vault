import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import './VaultSettingsPage.css';

type VaultHealthStatus = 'healthy' | 'needs_attention' | 'missing' | 'unknown';

type VaultHealthSummary = {
  paths: {
    vaultRoot: string;
    databasePath: string;
    databaseFileName: string;
    archivePath: string;
    archiveFolderName: string;
  };
  health: {
    status: VaultHealthStatus;
    vaultRoot: VaultHealthStatus;
    databaseFile: VaultHealthStatus;
    archiveFolder: VaultHealthStatus;
    databaseConnection: VaultHealthStatus;
    warnings: string[];
  };
  storage: {
    archiveSizeBytes: number;
    databaseSizeBytes: number;
    diskFreeBytes: number | null;
    diskTotalBytes: number | null;
    diskUsedBytes: number | null;
    diskUsedPercent: number | null;
  };
  totals: {
    totalMemories: number;
    images: number;
    documents: number;
    videos: number;
    audio: number;
    collections: number;
    people: number;
    tags: number;
  };
  integrity: {
    missingFilesCount: number;
    orphanFilesCount: number;
    missingFiles: Array<{ id?: number; title?: string | null; fileName: string; filePath: string; mediaType?: string | null }>;
    orphanFiles: Array<{ fileName: string; filePath: string; size: number }>;
  };
  error?: string;
};

const statusLabels: Record<VaultHealthStatus, string> = {
  healthy: 'Healthy',
  needs_attention: 'Needs attention',
  missing: 'Missing',
  unknown: 'Unknown'
};

const statusVariants: Record<VaultHealthStatus, string> = {
  healthy: 'success',
  needs_attention: 'warning',
  missing: 'danger',
  unknown: 'secondary'
};

function formatBytes(bytes?: number | null) {
  if (bytes === null || bytes === undefined) return 'Unknown';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function StatusBadge({ status }: { status: VaultHealthStatus }) {
  return <Badge bg={statusVariants[status]}>{statusLabels[status]}</Badge>;
}

function PathRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="vault-settings-path-row">
      <span>{label}</span>
      <code title={value}>{value}</code>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="vault-settings-metric">
      <span className="vault-settings-metric__icon"><i className={`bi ${icon}`} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function VaultSettingsPage() {
  const [summary, setSummary] = useState<VaultHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMessage, setOpenMessage] = useState<string | null>(null);
  const [showMissingDetails, setShowMissingDetails] = useState(false);
  const [showOrphanDetails, setShowOrphanDetails] = useState(false);

  const loadVaultHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.getVaultHealth();
      if (result.error) {
        throw new Error(result.error);
      }
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load vault settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaultHealth();
  }, []);

  const diskUsedLabel = useMemo(() => {
    if (!summary?.storage.diskUsedPercent && summary?.storage.diskUsedPercent !== 0) return 'Unknown';
    return `${summary.storage.diskUsedPercent.toFixed(1)}% used`;
  }, [summary]);

  const openFolder = async (kind: 'vault' | 'archive') => {
    setOpenMessage(null);
    const result = kind === 'vault'
      ? await window.electronAPI.openVaultFolder()
      : await window.electronAPI.openArchiveFolder();

    if (!result.success) {
      setOpenMessage(result.error || `Unable to open ${kind} folder.`);
    }
  };

  if (loading) {
    return (
      <main className="vault-settings-page">
        <div className="vault-settings-loading">
          <Spinner animation="border" role="status" />
          <span>Checking vault health…</span>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="vault-settings-page">
        <Alert variant="danger">{error || 'Unable to load vault settings.'}</Alert>
        <Button onClick={loadVaultHealth}>Try again</Button>
      </main>
    );
  }

  return (
    <main className="vault-settings-page">
      <section className="vault-settings-hero">
        <div>
          <p className="vault-settings-eyebrow">Local archive settings</p>
          <h1>Vault Settings</h1>
          <p>Manage where your vault lives, check storage health, and prepare your archive for backup.</p>
        </div>
        <StatusBadge status={summary.health.status} />
      </section>

      {openMessage && <Alert variant="warning">{openMessage}</Alert>}
      {summary.health.warnings.length > 0 && (
        <Alert variant="warning">
          <strong>Needs attention:</strong>
          <ul className="mb-0 mt-2">
            {summary.health.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={7}>
          <Card className="vault-settings-card h-100">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">Vault Location</p>
                  <h2>Where your vault is stored</h2>
                </div>
                <i className="bi bi-folder2-open" />
              </div>
              <PathRow label="Current vault location" value={summary.paths.vaultRoot} />
              <PathRow label="Database file" value={`${summary.paths.databaseFileName} — ${summary.paths.databasePath}`} />
              <PathRow label="Media archive folder" value={summary.paths.archivePath} />
              <div className="vault-settings-actions">
                <Button onClick={() => openFolder('vault')}><i className="bi bi-folder2-open me-2" />Open Vault Folder</Button>
                <Button variant="outline-secondary" onClick={() => openFolder('archive')}>Open Archive Folder</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="vault-settings-card h-100">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">Vault Health</p>
                  <h2>Read-only status</h2>
                </div>
                <i className="bi bi-shield-check" />
              </div>
              <div className="vault-settings-status-list">
                <div><span>Vault folder access</span><StatusBadge status={summary.health.vaultRoot} /></div>
                <div><span>Database file</span><StatusBadge status={summary.health.databaseFile} /></div>
                <div><span>Archive folder</span><StatusBadge status={summary.health.archiveFolder} /></div>
                <div><span>Database connection</span><StatusBadge status={summary.health.databaseConnection} /></div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="vault-settings-card h-100">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">Storage</p>
                  <h2>Space overview</h2>
                </div>
                <i className="bi bi-hdd" />
              </div>
              <div className="vault-settings-metric-grid">
                <MetricCard label="Archive size" value={formatBytes(summary.storage.archiveSizeBytes)} icon="bi-archive" />
                <MetricCard label="Database size" value={formatBytes(summary.storage.databaseSizeBytes)} icon="bi-database" />
                <MetricCard label="Drive free space" value={formatBytes(summary.storage.diskFreeBytes)} icon="bi-device-hdd" />
                <MetricCard label="Drive usage" value={`${formatBytes(summary.storage.diskUsedBytes)} / ${formatBytes(summary.storage.diskTotalBytes)} · ${diskUsedLabel}`} icon="bi-pie-chart" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="vault-settings-card h-100">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">Vault Totals</p>
                  <h2>Indexed content</h2>
                </div>
                <i className="bi bi-bar-chart" />
              </div>
              <div className="vault-settings-totals-grid">
                <MetricCard label="Memories" value={summary.totals.totalMemories} icon="bi-images" />
                <MetricCard label="Images" value={summary.totals.images} icon="bi-image" />
                <MetricCard label="Documents" value={summary.totals.documents} icon="bi-file-earmark-text" />
                <MetricCard label="Videos" value={summary.totals.videos} icon="bi-camera-video" />
                <MetricCard label="Audio" value={summary.totals.audio} icon="bi-music-note-beamed" />
                <MetricCard label="Collections" value={summary.totals.collections} icon="bi-collection" />
                <MetricCard label="People" value={summary.totals.people} icon="bi-people" />
                <MetricCard label="Tags" value={summary.totals.tags} icon="bi-tags" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="vault-settings-card">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">Integrity / Health Checks</p>
                  <h2>Read-only file checks</h2>
                  <p className="vault-settings-muted">These checks only count and display issues. Nothing is deleted or modified.</p>
                </div>
                <Button variant="outline-primary" onClick={loadVaultHealth}>Refresh checks</Button>
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <div className="vault-settings-integrity-box">
                    <div>
                      <span>Missing files</span>
                      <strong>{summary.integrity.missingFilesCount}</strong>
                    </div>
                    <p>Media records whose archived file cannot be found on disk.</p>
                    {summary.integrity.missingFiles.length > 0 && (
                      <Button variant="link" className="p-0" onClick={() => setShowMissingDetails((current) => !current)}>
                        {showMissingDetails ? 'Hide details' : 'View details'}
                      </Button>
                    )}
                    {showMissingDetails && (
                      <ul className="vault-settings-file-list">
                        {summary.integrity.missingFiles.map((file) => (
                          <li key={`${file.id}-${file.filePath}`}>
                            <strong>{file.title || file.fileName}</strong>
                            <code>{file.filePath}</code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="vault-settings-integrity-box">
                    <div>
                      <span>Orphan files</span>
                      <strong>{summary.integrity.orphanFilesCount}</strong>
                    </div>
                    <p>Files in the archive folder that are not referenced by media records.</p>
                    {summary.integrity.orphanFiles.length > 0 && (
                      <Button variant="link" className="p-0" onClick={() => setShowOrphanDetails((current) => !current)}>
                        {showOrphanDetails ? 'Hide details' : 'View details'}
                      </Button>
                    )}
                    {showOrphanDetails && (
                      <ul className="vault-settings-file-list">
                        {summary.integrity.orphanFiles.map((file) => (
                          <li key={file.filePath}>
                            <strong>{file.fileName}</strong>
                            <span>{formatBytes(file.size)}</span>
                            <code>{file.filePath}</code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </main>
  );
}

export default VaultSettingsPage;
