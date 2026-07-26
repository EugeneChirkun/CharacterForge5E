import type { CharacterRecord, CharacterRepository } from '../characters/character-repository';
import { APPLICATION_VERSION } from '../../config/application-version';
import {
  BACKUP_FORMAT,
  BACKUP_LIMITS,
  BACKUP_VERSION,
  type BackupDiagnostic,
  type CharacterForgeBackup,
  type ImportPolicy,
} from '../../domain/backup/backup-schema';
import { migratePersistedCharacter } from '../../infrastructure/persistence/migrations/migrate-persisted-character';

export type BackupValidationResult =
  | { readonly success: true; readonly backup: CharacterForgeBackup; readonly warnings: readonly BackupDiagnostic[] }
  | { readonly success: false; readonly diagnostics: readonly BackupDiagnostic[] };

const error = (code: string, message: string): BackupValidationResult => ({
  success: false,
  diagnostics: [{ code, message, severity: 'error' }],
});

export function createBackup(records: readonly CharacterRecord[], now = new Date()): CharacterForgeBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    applicationVersion: APPLICATION_VERSION,
    characters: records.map((record) => structuredClone(record)),
  };
}

export function serializeBackup(backup: CharacterForgeBackup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function safeFilename(name: string): string {
  const safe = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return (safe || 'character').slice(0, 80);
}

export function backupFilename(name?: string, now = new Date()): string {
  const date = now.toISOString().slice(0, 10);
  return name
    ? `characterforge5e-character-${safeFilename(name)}-${date}.json`
    : `characterforge5e-backup-${date}.json`;
}

export function validateBackupText(text: string): BackupValidationResult {
  if (new Blob([text]).size > BACKUP_LIMITS.bytes) return error('file-too-large', 'Backup exceeds the 5 MB safety limit.');
  let input: unknown;
  try { input = JSON.parse(text); } catch { return error('invalid-json', 'The selected file is not valid JSON.'); }
  if (!input || typeof input !== 'object') return error('invalid-backup', 'Backup must be a JSON object.');
  const value = input as Record<string, unknown>;
  if (value.format !== BACKUP_FORMAT) return error('wrong-format', 'This is not a CharacterForge5E backup.');
  if (value.version !== BACKUP_VERSION) return error('unsupported-version', `Backup version ${String(value.version)} is not supported.`);
  if (typeof value.exportedAt !== 'string' || Number.isNaN(Date.parse(value.exportedAt))) return error('invalid-export-date', 'The backup export date is invalid.');
  if (typeof value.applicationVersion !== 'string' || !Array.isArray(value.characters)) return error('missing-field', 'The backup is missing required fields.');
  if (value.characters.length > BACKUP_LIMITS.characters) return error('too-many-characters', `Backups may contain at most ${BACKUP_LIMITS.characters} characters.`);
  const records: CharacterRecord[] = [];
  const warnings: BackupDiagnostic[] = [];
  const ids = new Set<string>();
  for (const raw of value.characters) {
    const migrated = migratePersistedCharacter(raw);
    if (!migrated.success) return { success: false, diagnostics: migrated.diagnostics };
    if (ids.has(migrated.record.build.id)) return error('duplicate-backup-id', 'Character IDs in a backup must be unique.');
    ids.add(migrated.record.build.id);
    if (migrated.record.build.name.length > BACKUP_LIMITS.nameLength) return error('string-too-long', 'A character name exceeds the safety limit.');
    if ((migrated.record.session.inventory?.items.length ?? 0) > BACKUP_LIMITS.inventoryInstances) return error('inventory-too-large', 'A character inventory exceeds the safety limit.');
    records.push(migrated.record);
    warnings.push(...migrated.diagnostics.filter((d) => d.severity === 'warning'));
  }
  return { success: true, backup: { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: value.exportedAt, applicationVersion: value.applicationVersion, characters: records }, warnings };
}

export interface BackupPreview { readonly backup: CharacterForgeBackup; readonly conflicts: readonly string[]; readonly warnings: readonly BackupDiagnostic[] }
export async function previewImport(text: string, repository: CharacterRepository): Promise<BackupPreview | BackupValidationResult> {
  const validated = validateBackupText(text);
  if (!validated.success) return validated;
  const existing = new Set((await repository.list()).map((record) => record.build.id));
  return { backup: validated.backup, conflicts: validated.backup.characters.filter((r) => existing.has(r.build.id)).map((r) => r.build.id), warnings: validated.warnings };
}

export async function importBackup(backup: CharacterForgeBackup, policy: ImportPolicy, repository: CharacterRepository) {
  const existing = await repository.list();
  const ids = new Set(existing.map((record) => record.build.id));
  const skipped: string[] = [];
  const imported: CharacterRecord[] = [];
  for (const record of backup.characters) {
    if (ids.has(record.build.id) && policy === 'skip') { skipped.push(record.build.id); continue; }
    if (ids.has(record.build.id) && policy === 'keep-both') {
      const id = crypto.randomUUID();
      imported.push({ ...structuredClone(record), build: { ...record.build, id, name: `${record.build.name} (Copy)` }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } else imported.push(structuredClone(record));
  }
  if (repository.replaceAll) {
    const importedIds = new Set(imported.map((r) => r.build.id));
    await repository.replaceAll([...existing.filter((r) => !importedIds.has(r.build.id)), ...imported]);
  } else {
    for (const record of imported) await repository.save(record);
  }
  return { success: true as const, importedCharacterIds: imported.map((r) => r.build.id), skippedCharacterIds: skipped, warnings: [] };
}
