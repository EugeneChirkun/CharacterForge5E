import type { CharacterRecord } from '../../../application/characters/character-repository';
import type { BackupDiagnostic } from '../../../domain/backup/backup-schema';
import {
  startingInventory,
  validateInventory,
} from '../../../domain/equipment';

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const inventoryShape = (value: unknown) =>
  object(value) &&
  Array.isArray(value.items) &&
  object(value.currency) &&
  typeof value.attunementLimit === 'number';
export type MigrationResult =
  | {
      readonly success: true;
      readonly record: CharacterRecord;
      readonly diagnostics: readonly BackupDiagnostic[];
    }
  | {
      readonly success: false;
      readonly raw: unknown;
      readonly diagnostics: readonly BackupDiagnostic[];
    };

export function migratePersistedCharacter(input: unknown): MigrationResult {
  const fail = (code: string, message: string): MigrationResult => ({
    success: false,
    raw: input,
    diagnostics: [{ code, message, severity: 'error' }],
  });
  if (!object(input))
    return fail('invalid-record', 'Character record must be an object.');
  if (
    input.schemaVersion !== 1 &&
    input.schemaVersion !== 2 &&
    input.schemaVersion !== 3
  )
    return fail(
      'unsupported-schema-version',
      'Character persistence version is not supported.',
    );
  if (
    !object(input.build) ||
    typeof input.build.id !== 'string' ||
    !input.build.id ||
    input.build.id === 'reference' ||
    typeof input.build.name !== 'string'
  )
    return fail(
      'missing-required-field',
      'Character build ID and name are required.',
    );
  if (
    !object(input.session) ||
    typeof input.createdAt !== 'string' ||
    typeof input.updatedAt !== 'string'
  )
    return fail(
      'missing-required-field',
      'Character session and timestamps are required.',
    );
  const diagnostics: BackupDiagnostic[] = [];
  const candidate = input.session.inventory;
  const inventory =
    inventoryShape(candidate) &&
    validateInventory(candidate as never).every((d) => d.severity !== 'error')
      ? candidate
      : startingInventory();
  if (candidate !== inventory)
    diagnostics.push({
      code: 'field-defaulted',
      message:
        'Invalid or missing inventory was replaced with starting inventory.',
      severity: 'warning',
      characterId: input.build.id,
    });
  if (input.schemaVersion === 1)
    diagnostics.push({
      code: 'migration-applied',
      message: 'Character migrated from schema version 1.',
      severity: 'warning',
      characterId: input.build.id,
    });
  const build = input.build as Record<string, unknown>;
  const cls = object(build.class) ? build.class : undefined;
  let migratedBuild =
    cls?.classId === 'druid' && !cls.primalOrder
      ? {
          ...build,
          requiredBuildChoices: [
            {
              code: 'missing-required-build-choice',
              choiceId: 'druid.primal-order',
            },
          ],
        }
      : build;
  if (migratedBuild !== build)
    diagnostics.push({
      code: 'missing-required-build-choice',
      message: 'Choose a Druid Primal Order before continuing.',
      severity: 'warning',
      characterId: input.build.id as string,
    });
  if (!migratedBuild.startingEquipmentChoices) {
    migratedBuild = {
      ...migratedBuild,
      startingEquipmentChoices: [
        {
          sourceId: 'druid.class.starting-equipment',
          choiceType: 'legacy-unknown',
        },
        {
          sourceId: 'farmer.background.starting-equipment',
          choiceType: 'legacy-unknown',
        },
      ],
    };
    diagnostics.push({
      code: 'legacy-starting-equipment-unresolved',
      message:
        'Existing inventory and wallet were preserved; historical starting choices are unknown.',
      severity: 'warning',
      characterId: input.build.id as string,
    });
  }
  return {
    success: true,
    record: {
      ...input,
      build: migratedBuild,
      schemaVersion: 3,
      session: { ...input.session, inventory },
    } as unknown as CharacterRecord,
    diagnostics,
  };
}
