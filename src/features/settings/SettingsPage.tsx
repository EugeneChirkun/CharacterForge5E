import { useEffect, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { APPLICATION_VERSION } from '../../config/application-version';
import { createBackup, importBackup, previewImport, backupFilename, serializeBackup, type BackupPreview } from '../../application/backup/backup-controller';
import type { ImportPolicy } from '../../domain/backup/backup-schema';
import { LocalCharacterRepository, OWNED_STORAGE_KEYS, inspectLocalCharacterRecords } from '../../infrastructure/persistence/local-character-repository';
import { checkStorageHealth } from '../../infrastructure/persistence/storage-health';
import { downloadJson, readBackupFile } from '../../infrastructure/persistence/backup-file-adapter';
import { applicationUpdateController } from '../../application/updates/application-update-controller';

const repository = new LocalCharacterRepository(localStorage);
export function SettingsPage() {
  const [health, setHealth] = useState(() => checkStorageHealth(localStorage));
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [policy, setPolicy] = useState<ImportPolicy>('skip');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [updateStatus, setUpdateStatus] = useState(applicationUpdateController.status);
  useEffect(() => applicationUpdateController.subscribe(setUpdateStatus), []);
  const exportAll = async () => downloadJson(serializeBackup(createBackup(await repository.list())), backupFilename());
  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    setPreview(null);
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await previewImport(await readBackupFile(file), repository);
      if ('success' in result && !result.success) setMessage(result.diagnostics.map((d) => d.message).join(' '));
      else { setPreview(result as BackupPreview); setMessage('Backup validated. Review the preview before importing.'); }
    } catch (cause) { setMessage(cause instanceof Error && cause.message === 'file-too-large' ? 'The file exceeds the 5 MB safety limit.' : 'The backup could not be read.'); }
  };
  const apply = async () => {
    if (!preview) return;
    const result = await importBackup(preview.backup, policy, repository);
    setMessage(`Imported ${result.importedCharacterIds.length}; skipped ${result.skippedCharacterIds.length}. Reloading…`);
    location.reload();
  };
  const exportCorrupt = () => downloadJson(JSON.stringify(inspectLocalCharacterRecords(localStorage).corrupt, null, 2), `characterforge5e-recovery-${new Date().toISOString().slice(0, 10)}.json`);
  const reset = () => {
    if (confirmation !== 'DELETE') return;
    OWNED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    location.assign(`${import.meta.env.BASE_URL}#/characters`);
  };
  return <main className="settings-page">
    <Link to="/characters">← Characters</Link>
    <h1>Settings</h1>
    <section><h2>Application</h2><dl><dt>Version</dt><dd>{APPLICATION_VERSION}</dd><dt>Persistence schema</dt><dd>2</dd><dt>Installation</dt><dd>{matchMedia('(display-mode: standalone)').matches ? 'Installed / standalone mode detected' : 'Browser tab (installation availability varies)'}</dd></dl></section>
    <section><h2>Backup and Restore</h2><p>Backups contain your user-owned character build, session, spell preparation, and inventory state.</p><button type="button" onClick={() => void exportAll()}>Export all characters</button>{' '}<label className="file-label">Import backup <input type="file" accept="application/json,.json" onChange={(e) => void chooseFile(e)} /></label>
      {message && <p role="status">{message}</p>}
      {preview && <div className="import-preview" aria-labelledby="import-preview-title"><h3 id="import-preview-title">Import preview</h3><p>Version {preview.backup.version} · exported {new Date(preview.backup.exportedAt).toLocaleString()} · {preview.backup.characters.length} character(s)</p><ul>{preview.backup.characters.map((r) => <li key={r.build.id}>{r.build.name}{preview.conflicts.includes(r.build.id) ? ' — ID conflict' : ''}</li>)}</ul><label>Conflict policy<select value={policy} onChange={(e) => setPolicy(e.target.value as ImportPolicy)}><option value="skip">Skip duplicates</option><option value="replace">Replace existing</option><option value="keep-both">Keep both</option></select></label><button type="button" onClick={() => void apply()}>Import characters</button></div>}
    </section>
    <section><h2>Storage</h2><dl><dt>Storage available</dt><dd>{health.available ? 'Yes' : 'No'}</dd><dt>Write test</dt><dd>{health.writeTestPassed ? 'Passed' : 'Failed'}</dd><dt>Valid characters</dt><dd>{health.validCharacters}</dd><dt>Corrupt records</dt><dd>{health.corruptRecords}</dd><dt>Approximate character data</dt><dd>{health.approximateBytes === undefined ? 'Unavailable' : `${health.approximateBytes} bytes`}</dd></dl>{health.error && <p role="alert">{health.error} Export a backup or check browser storage permissions.</p>}{health.corruptRecords > 0 && <button type="button" onClick={exportCorrupt}>Export corrupt records for recovery</button>}<button type="button" className="secondary" onClick={() => setHealth(checkStorageHealth(localStorage))}>Run health check</button></section>
    <section><h2>Offline and Updates</h2><p>Service worker status: {updateStatus}. Offline readiness is confirmed only after the production app shell has installed successfully.</p>{updateStatus === 'update-available' && <button type="button" onClick={() => applicationUpdateController.updateNow()}>Update now</button>}</section>
    <section><h2>Accessibility</h2><p>CharacterForge5E supports keyboard focus, semantic landmarks, reduced motion, and print styles. Browser and assistive technology combinations may differ.</p></section>
    <section className="danger-zone"><h2>Danger Zone</h2><p>Export a backup first. Reset permanently removes only CharacterForge5E-owned browser storage.</p><label>Type DELETE to confirm<input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label><button type="button" className="danger" disabled={confirmation !== 'DELETE'} onClick={reset}>Reset application data</button></section>
    <footer><p><strong>Privacy:</strong> Character data remains in this browser unless you export it. No accounts, analytics, telemetry, or cloud synchronization are used.</p></footer>
  </main>;
}
