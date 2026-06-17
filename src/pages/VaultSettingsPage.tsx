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

type VaultCopyResult = {
  success: boolean;
  destinationPath?: string;
  copiedFileCount?: number;
  totalBytesCopied?: number;
  canceled?: boolean;
  error?: string;
};

type CopyOperationKind = 'backup' | 'shareable';

type CopyOperationState = {
  status: 'idle' | 'creating' | 'complete' | 'failed';
  result?: VaultCopyResult;
  error?: string;
};

type MetricAccent = 'gold' | 'blue' | 'teal' | 'purple' | 'rose' | 'indigo' | 'green' | 'slate';

function MetricCard({
  label,
  value,
  icon,
  accent = 'gold',
  featured = false
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: MetricAccent;
  featured?: boolean;
}) {
  return (
    <div className={`vault-settings-metric vault-settings-metric--${accent}${featured ? ' vault-settings-metric--featured' : ''}`}>
      <span className="vault-settings-metric__icon"><i className={`bi ${icon}`} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

type StorageSegment = {
  key: string;
  label: string;
  bytes: number;
  className: string;
  percent: number;
};

function buildStorageSegments(summary: VaultHealthSummary | null): StorageSegment[] {
  if (!summary?.storage.diskTotalBytes || summary.storage.diskTotalBytes <= 0) return [];

  const totalBytes = summary.storage.diskTotalBytes;
  const archiveBytes = Math.min(Math.max(summary.storage.archiveSizeBytes || 0, 0), totalBytes);
  const databaseBytes = Math.min(Math.max(summary.storage.databaseSizeBytes || 0, 0), totalBytes - archiveBytes);
  const usedBytes = Math.min(Math.max(summary.storage.diskUsedBytes || 0, archiveBytes + databaseBytes), totalBytes);
  const freeBytes = Math.max(summary.storage.diskFreeBytes ?? totalBytes - usedBytes, 0);
  const otherUsedBytes = Math.max(usedBytes - archiveBytes - databaseBytes, 0);

  return [
    { key: 'archive', label: 'Vault media archive', bytes: archiveBytes, className: 'vault-settings-storage-bar__segment--archive', percent: (archiveBytes / totalBytes) * 100 },
    { key: 'database', label: 'Vault database', bytes: databaseBytes, className: 'vault-settings-storage-bar__segment--database', percent: (databaseBytes / totalBytes) * 100 },
    { key: 'other', label: 'Other used space', bytes: otherUsedBytes, className: 'vault-settings-storage-bar__segment--other', percent: (otherUsedBytes / totalBytes) * 100 },
    { key: 'free', label: 'Free space', bytes: freeBytes, className: 'vault-settings-storage-bar__segment--free', percent: (freeBytes / totalBytes) * 100 }
  ].filter((segment) => segment.bytes > 0);
}

function VaultSettingsPage() {
  const [summary, setSummary] = useState<VaultHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMessage, setOpenMessage] = useState<string | null>(null);
  const [showMissingDetails, setShowMissingDetails] = useState(false);
  const [showOrphanDetails, setShowOrphanDetails] = useState(false);
  const [copyOperations, setCopyOperations] = useState<Record<CopyOperationKind, CopyOperationState>>({
    backup: { status: 'idle' },
    shareable: { status: 'idle' }
  });

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

  const storageSegments = useMemo(() => buildStorageSegments(summary), [summary]);

  const openFolder = async (kind: 'vault' | 'archive') => {
    setOpenMessage(null);
    const result = kind === 'vault'
      ? await window.electronAPI.openVaultFolder()
      : await window.electronAPI.openArchiveFolder();

    if (!result.success) {
      setOpenMessage(result.error || `Unable to open ${kind} folder.`);
    }
  };

  const isCopyOperationRunning = copyOperations.backup.status === 'creating' || copyOperations.shareable.status === 'creating';

  const startCopyOperation = async (kind: CopyOperationKind) => {
    setCopyOperations((current) => ({
      ...current,
      [kind]: { status: 'creating' }
    }));

    try {
      const result = kind === 'backup'
        ? await window.electronAPI.createVaultBackup()
        : await window.electronAPI.createVaultShareableCopy();

      if (result.canceled) {
        setCopyOperations((current) => ({
          ...current,
          [kind]: { status: 'idle' }
        }));
        return;
      }

      if (!result.success) {
        throw new Error(result.error || (kind === 'backup' ? 'Backup failed. Please try again.' : 'Shareable copy failed. Please try again.'));
      }

      setCopyOperations((current) => ({
        ...current,
        [kind]: { status: 'complete', result }
      }));
    } catch (err) {
      setCopyOperations((current) => ({
        ...current,
        [kind]: {
          status: 'failed',
          error: err instanceof Error ? err.message : (kind === 'backup' ? 'Backup failed. Please try again.' : 'Shareable copy failed. Please try again.')
        }
      }));
    }
  };

  const openCreatedOutputFolder = async (folderPath: string) => {
    const result = await window.electronAPI.openVaultOutputFolder(folderPath);
    if (!result.success) {
      setOpenMessage(result.error || 'Unable to open the created folder.');
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

      <Row className="g-4 vault-settings-grid">
        <Col xs={12}>
          <Card className="vault-settings-card h-100">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">Memory Vault Library</p>
                  <h2>Your Memory Vault Library is stored here</h2>
                </div>
                <i className="bi bi-folder2-open" />
              </div>
              <div className="vault-settings-primary-location">
                <span>Library folder</span>
                <code title={summary.paths.vaultRoot}>{summary.paths.vaultRoot}</code>
                <p>Your memories and details are stored here, separate from the Memory Vault app.</p>
              </div>
              <details className="vault-settings-technical-details">
                <summary>Technical details</summary>
                <PathRow label="Database file" value={`${summary.paths.databaseFileName} — ${summary.paths.databasePath}`} />
                <PathRow label="Media archive folder" value={summary.paths.archivePath} />
              </details>
              <div className="vault-settings-actions">
                <Button onClick={() => openFolder('vault')}><i className="bi bi-folder2-open me-2" />Open Library Folder</Button>
                <Button variant="outline-secondary" onClick={() => openFolder('archive')}>Open Archive Folder</Button>
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
                  <h2>Storage overview</h2>
                </div>
                <i className="bi bi-hdd" />
              </div>
              {storageSegments.length > 0 ? (
                <div className="vault-settings-storage-overview">
                  <div className="vault-settings-storage-overview__summary">
                    <strong>{diskUsedLabel}</strong>
                    <span>{formatBytes(summary.storage.diskFreeBytes)} free of {formatBytes(summary.storage.diskTotalBytes)}</span>
                  </div>
                  <div className="vault-settings-storage-bar" aria-label="Drive storage usage">
                    {storageSegments.map((segment) => (
                      <div
                        key={segment.key}
                        className={`vault-settings-storage-bar__segment ${segment.className}`}
                        style={{ width: `${segment.percent}%`, minWidth: segment.percent > 0 && segment.percent < 1 ? '8px' : undefined }}
                        title={`${segment.label}: ${formatBytes(segment.bytes)} (${segment.percent.toFixed(1)}%)`}
                      />
                    ))}
                  </div>
                  <div className="vault-settings-storage-legend">
                    {storageSegments.map((segment) => (
                      <div key={segment.key}>
                        <span className={`vault-settings-storage-legend__dot ${segment.className}`} />
                        <span>{segment.label}</span>
                        <strong>{formatBytes(segment.bytes)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="vault-settings-muted">Drive usage is unavailable on this system, but vault file sizes are shown below.</p>
              )}
              <div className="vault-settings-metric-grid vault-settings-metric-grid--storage">
                <MetricCard label="Memories archive size" value={formatBytes(summary.storage.archiveSizeBytes)} icon="bi-archive" accent="blue" />
                <MetricCard label="Details file size" value={formatBytes(summary.storage.databaseSizeBytes)} icon="bi-database" accent="teal" />
                <MetricCard label="Drive free space" value={formatBytes(summary.storage.diskFreeBytes)} icon="bi-device-hdd" accent="green" />
                <MetricCard label="Drive usage" value={`${formatBytes(summary.storage.diskUsedBytes)} / ${formatBytes(summary.storage.diskTotalBytes)} · ${diskUsedLabel}`} icon="bi-pie-chart" accent="slate" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="vault-settings-card h-100">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">File Checks</p>
                  <h2>File checks</h2>
                  <p className="vault-settings-muted">These checks only report issues. Nothing is deleted or modified.</p>
                </div>
                <Button variant="outline-primary" onClick={loadVaultHealth}>Refresh checks</Button>
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <div className="vault-settings-integrity-box">
                    <div>
                      <span>Memories whose files cannot be found</span>
                      <strong>{summary.integrity.missingFilesCount}</strong>
                    </div>
                    <p>Memories whose archived file cannot be found on disk.</p>
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
                      <span>Extra files not linked to a memory</span>
                      <strong>{summary.integrity.orphanFilesCount}</strong>
                    </div>
                    <p>Files in the archive folder that are not linked to any memory details.</p>
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

        <Col xs={12}>
          <Card className="vault-settings-card vault-settings-backup-card">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">Library Management</p>
                  <h2>Backup &amp; Copy</h2>
                  <p className="vault-settings-muted">Create a safety backup of your Memory Vault Library or prepare a copy to share with family.</p>
                </div>
                <i className="bi bi-copy" />
              </div>
              <p className="vault-settings-copy-note">Backups protect your Memory Vault Library. Shareable copies give another family member a copy they can open later as an existing library.</p>
              <Row className="g-3">
                <Col md={6}>
                  <div className="vault-settings-copy-action vault-settings-copy-action--backup">
                    <div className="vault-settings-copy-action__icon"><i className="bi bi-shield-lock" /></div>
                    <div className="vault-settings-copy-action__body">
                      <h3>Create Backup</h3>
                      <p>Backups preserve your Memory Vault Library so you can restore your memories and details later.</p>
                      <Button disabled={isCopyOperationRunning} onClick={() => startCopyOperation('backup')}>
                        {copyOperations.backup.status === 'creating' ? 'Creating backup…' : 'Create Backup'}
                      </Button>
                    </div>
                    {copyOperations.backup.status === 'complete' && copyOperations.backup.result?.destinationPath && (
                      <Alert variant="success" className="vault-settings-copy-result">
                        <strong>Backup created successfully.</strong>
                        <code>{copyOperations.backup.result.destinationPath}</code>
                        <span>{copyOperations.backup.result.copiedFileCount ?? 0} files · {formatBytes(copyOperations.backup.result.totalBytesCopied)}</span>
                        <Button size="sm" variant="outline-success" onClick={() => openCreatedOutputFolder(copyOperations.backup.result!.destinationPath!)}>Open Backup Folder</Button>
                      </Alert>
                    )}
                    {copyOperations.backup.status === 'failed' && (
                      <Alert variant="danger" className="vault-settings-copy-result">{copyOperations.backup.error}</Alert>
                    )}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="vault-settings-copy-action vault-settings-copy-action--shareable">
                    <div className="vault-settings-copy-action__icon"><i className="bi bi-people" /></div>
                    <div className="vault-settings-copy-action__body">
                      <h3>Create Shareable Copy</h3>
                      <p>A shareable copy contains Memory Vault Library data so another family member can keep and open a copy of the memories.</p>
                      <Button variant="outline-primary" disabled={isCopyOperationRunning} onClick={() => startCopyOperation('shareable')}>
                        {copyOperations.shareable.status === 'creating' ? 'Creating copy…' : 'Create Shareable Copy'}
                      </Button>
                    </div>
                    {copyOperations.shareable.status === 'complete' && copyOperations.shareable.result?.destinationPath && (
                      <Alert variant="success" className="vault-settings-copy-result">
                        <strong>Shareable copy created successfully.</strong>
                        <code>{copyOperations.shareable.result.destinationPath}</code>
                        <span>{copyOperations.shareable.result.copiedFileCount ?? 0} files · {formatBytes(copyOperations.shareable.result.totalBytesCopied)}</span>
                        <Button size="sm" variant="outline-success" onClick={() => openCreatedOutputFolder(copyOperations.shareable.result!.destinationPath!)}>Open Copy Folder</Button>
                      </Alert>
                    )}
                    {copyOperations.shareable.status === 'failed' && (
                      <Alert variant="danger" className="vault-settings-copy-result">{copyOperations.shareable.error}</Alert>
                    )}
                  </div>
                </Col>
              </Row>
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
                <MetricCard label="Memories" value={summary.totals.totalMemories} icon="bi-images" accent="indigo" featured />
                <div className="vault-settings-stat-group">
                  <span>Memory types</span>
                  <MetricCard label="Images" value={summary.totals.images} icon="bi-image" accent="blue" />
                  <MetricCard label="Documents" value={summary.totals.documents} icon="bi-file-earmark-text" accent="teal" />
                  <MetricCard label="Videos" value={summary.totals.videos} icon="bi-camera-video" accent="purple" />
                  <MetricCard label="Audio" value={summary.totals.audio} icon="bi-music-note-beamed" accent="rose" />
                </div>
                <div className="vault-settings-stat-group vault-settings-stat-group--organization">
                  <span>Organization</span>
                  <MetricCard label="Collections" value={summary.totals.collections} icon="bi-collection" accent="green" />
                  <MetricCard label="People" value={summary.totals.people} icon="bi-people" accent="green" />
                  <MetricCard label="Tags" value={summary.totals.tags} icon="bi-tags" accent="green" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="vault-settings-card h-100">
            <Card.Body>
              <div className="vault-settings-card__header">
                <div>
                  <p className="vault-settings-eyebrow">Vault Health</p>
                  <h2>Vault status</h2>
                  <p className="vault-settings-muted">These checks report issues only. Nothing is deleted or modified.</p>
                </div>
                <i className="bi bi-shield-check" />
              </div>
              <div className="vault-settings-status-list">
                <div><span>Library folder access</span><StatusBadge status={summary.health.vaultRoot} /></div>
                <div><span>Details file</span><StatusBadge status={summary.health.databaseFile} /></div>
                <div><span>Archive folder</span><StatusBadge status={summary.health.archiveFolder} /></div>
                <div><span>Details file connection</span><StatusBadge status={summary.health.databaseConnection} /></div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </main>
  );
}

export default VaultSettingsPage;
