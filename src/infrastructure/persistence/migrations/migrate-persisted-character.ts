import type { CharacterRecord } from '../../../application/characters/character-repository';
import type { BackupDiagnostic } from '../../../domain/backup/backup-schema';
import { startingInventory, validateInventory } from '../../../domain/equipment';

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const inventoryShape = (value: unknown) => object(value) && Array.isArray(value.items) && object(value.currency) && typeof value.attunementLimit === 'number';
export type MigrationResult =
  | { readonly success: true; readonly record: CharacterRecord; readonly diagnostics: readonly BackupDiagnostic[] }
  | { readonly success: false; readonly raw: unknown; readonly diagnostics: readonly BackupDiagnostic[] };

export function migratePersistedCharacter(input: unknown): MigrationResult {
  const fail = (code: string, message: string): MigrationResult => ({ success: false, raw: input, diagnostics: [{ code, message, severity: 'error' }] });
  if (!object(input)) return fail('invalid-record', 'Character record must be an object.');
  if (input.schemaVersion !== 1 && input.schemaVersion !== 2) return fail('unsupported-schema-version', 'Character persistence version is not supported.');
  if (!object(input.build) || typeof input.build.id !== 'string' || !input.build.id || input.build.id === 'reference' || typeof input.build.name !== 'string') return fail('missing-required-field', 'Character build ID and name are required.');
  if (!object(input.session) || typeof input.createdAt !== 'string' || typeof input.updatedAt !== 'string') return fail('missing-required-field', 'Character session and timestamps are required.');
  const diagnostics: BackupDiagnostic[] = [];
  const candidate = input.session.inventory;
  const inventory = inventoryShape(candidate) && validateInventory(candidate as never).every((d) => d.severity !== 'error') ? candidate : startingInventory();
  if (candidate !== inventory) diagnostics.push({ code: 'field-defaulted', message: 'Invalid or missing inventory was replaced with starting inventory.', severity: 'warning', characterId: input.build.id });
  if (input.schemaVersion === 1) diagnostics.push({ code: 'migration-applied', message: 'Character migrated from schema version 1.', severity: 'warning', characterId: input.build.id });
  return { success: true, record: { ...input, schemaVersion: 2, session: { ...input.session, inventory } } as unknown as CharacterRecord, diagnostics };
}
