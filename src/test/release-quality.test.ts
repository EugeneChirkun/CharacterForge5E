import { describe, expect, test } from 'vitest';
import { BACKUP_FORMAT, BACKUP_VERSION } from '../domain/backup/backup-schema';
import { backupFilename, createBackup, importBackup, safeFilename, serializeBackup, validateBackupText } from '../application/backup/backup-controller';
import { LocalCharacterRepository, RECORDS_KEY, type KeyValueStorage } from '../infrastructure/persistence/local-character-repository';
import { checkStorageHealth } from '../infrastructure/persistence/storage-health';
import { migratePersistedCharacter } from '../infrastructure/persistence/migrations/migrate-persisted-character';
import type { CharacterRecord } from '../application/characters/character-repository';
import { referenceBuild, referenceSession } from '../features/characters/referenceCharacter';

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}
function record(id = 'backup-id'): CharacterRecord {
  return { schemaVersion: 2, build: { ...structuredClone(referenceBuild), id, name: 'Éowyn / the Wise' }, session: structuredClone(referenceSession), createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
}

describe('release-quality backup pipeline', () => {
  test('exports deterministic, versioned, human-readable persistent records', () => {
    const backup = createBackup([record()], new Date('2026-02-03T04:05:06.000Z'));
    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(serializeBackup(backup)).toBe(serializeBackup(backup));
    expect(JSON.parse(serializeBackup(backup)).characters[0].maximumHp).toBeUndefined();
  });
  test('sanitizes Unicode and punctuation in download filenames', () => {
    expect(safeFilename('Éowyn / the Wise')).toBe('eowyn-the-wise');
    expect(backupFilename('../../')).not.toContain('..');
  });
  test.each([
    ['invalid JSON', '{', 'invalid-json'],
    ['wrong format', '{"format":"other"}', 'wrong-format'],
    ['unsupported version', JSON.stringify({ format: BACKUP_FORMAT, version: 99 }), 'unsupported-version'],
  ])('rejects %s', (_, text, code) => {
    const result = validateBackupText(text);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.diagnostics[0].code).toBe(code);
  });
  test('supports skip, replace and keep-both conflict policies atomically', async () => {
    for (const policy of ['skip', 'replace', 'keep-both'] as const) {
      const repo = new LocalCharacterRepository(new MemoryStorage());
      await repo.save(record());
      const result = await importBackup(createBackup([record()]), policy, repo);
      expect(result.success).toBe(true);
      expect(await repo.list()).toHaveLength(policy === 'keep-both' ? 2 : 1);
    }
  });
});

describe('release-quality migration and storage isolation', () => {
  test('migration is idempotent and defaults a legacy inventory', () => {
    const legacy = { ...record(), schemaVersion: 1, session: { ...record().session, inventory: undefined } };
    const first = migratePersistedCharacter(legacy);
    expect(first.success).toBe(true);
    if (!first.success) return;
    const second = migratePersistedCharacter(first.record);
    expect(second.success).toBe(true);
    if (second.success) expect(second.record).toEqual(first.record);
  });
  test('isolates corrupt records in the storage health report', () => {
    const storage = new MemoryStorage();
    storage.setItem(RECORDS_KEY, JSON.stringify([record(), { schemaVersion: 2, private: 'preserved raw' }]));
    const health = checkStorageHealth(storage);
    expect(health.validCharacters).toBe(1);
    expect(health.corruptRecords).toBe(1);
    expect(health.writeTestPassed).toBe(true);
  });
});
