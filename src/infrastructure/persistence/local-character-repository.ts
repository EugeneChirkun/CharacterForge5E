import type {
  CharacterDraftRepository,
  CharacterRecord,
  CharacterRepository,
} from '../../application/characters/character-repository';
import { newCharacterDraft, type CharacterDraft } from '../../domain/creation';
import { startingInventory, validateInventory } from '../../domain/equipment';
import { migratePersistedCharacter } from './migrations/migrate-persisted-character';
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const RECORDS_KEY = 'character-forge-records-v1';
export const DRAFT_KEY = 'character-forge-creation-draft-v1';
export const OWNED_STORAGE_KEYS = [
  RECORDS_KEY,
  DRAFT_KEY,
  'character-forge-state-v2',
] as const;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object';
function isLegacyOrCurrentRecord(v: unknown): v is Omit<
  CharacterRecord,
  'schemaVersion'
> & {
  readonly schemaVersion: 1 | 2 | 3;
} {
  return (
    object(v) &&
    (v.schemaVersion === 1 || v.schemaVersion === 2 || v.schemaVersion === 3) &&
    object(v.build) &&
    typeof v.build.id === 'string' &&
    v.build.id !== 'reference' &&
    object(v.session) &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string'
  );
}
export function isCharacterRecord(v: unknown): v is CharacterRecord {
  return (
    isLegacyOrCurrentRecord(v) &&
    (v.schemaVersion === 2 || v.schemaVersion === 3) &&
    object(v.session.inventory) &&
    Array.isArray(v.session.inventory.items) &&
    object(v.session.inventory.currency) &&
    validateInventory(v.session.inventory).every((d) => d.severity !== 'error')
  );
}
export function migrateRecords(value: unknown): readonly CharacterRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isLegacyOrCurrentRecord).map((record) => {
    const candidate = record.session.inventory;
    const inventory =
      candidate &&
      validateInventory(candidate).every((d) => d.severity !== 'error')
        ? candidate
        : startingInventory();
    const primalOrderBuild =
      record.build.class?.classId === 'druid' && !record.build.class.primalOrder
        ? {
            ...record.build,
            requiredBuildChoices: [
              {
                code: 'missing-required-build-choice' as const,
                choiceId: 'druid.primal-order' as const,
              },
            ],
          }
        : record.build;
    const build = primalOrderBuild.startingEquipmentChoices
      ? primalOrderBuild
      : {
          ...primalOrderBuild,
          startingEquipmentChoices: [
            {
              sourceId: 'druid.class.starting-equipment' as const,
              choiceType: 'legacy-unknown' as const,
            },
            {
              sourceId: 'farmer.background.starting-equipment' as const,
              choiceType: 'legacy-unknown' as const,
            },
          ],
        };
    return {
      ...record,
      schemaVersion: 3 as const,
      build,
      session: { ...record.session, inventory },
    };
  });
}
export function loadLocalCharacterRecords(
  storage: KeyValueStorage,
): readonly CharacterRecord[] {
  try {
    return migrateRecords(JSON.parse(storage.getItem(RECORDS_KEY) ?? '[]'));
  } catch {
    return [];
  }
}
export function inspectLocalCharacterRecords(storage: KeyValueStorage) {
  let raw: unknown;
  try {
    raw = JSON.parse(storage.getItem(RECORDS_KEY) ?? '[]');
  } catch {
    return {
      valid: [] as CharacterRecord[],
      corrupt: [
        { raw: storage.getItem(RECORDS_KEY), diagnostics: ['invalid-json'] },
      ],
    };
  }
  if (!Array.isArray(raw))
    return {
      valid: [] as CharacterRecord[],
      corrupt: [{ raw, diagnostics: ['invalid-records-container'] }],
    };
  const valid: CharacterRecord[] = [];
  const corrupt: { raw: unknown; diagnostics: readonly string[] }[] = [];
  raw.forEach((entry) => {
    const result = migratePersistedCharacter(entry);
    if (result.success) valid.push(result.record);
    else
      corrupt.push({
        raw: result.raw,
        diagnostics: result.diagnostics.map((d) => d.code),
      });
  });
  return { valid, corrupt };
}
export class LocalCharacterRepository implements CharacterRepository {
  constructor(private readonly storage: KeyValueStorage) {}
  private read(): readonly CharacterRecord[] {
    return loadLocalCharacterRecords(this.storage);
  }
  async list() {
    return this.read();
  }
  async get(id: string) {
    return this.read().find((r) => r.build.id === id) ?? null;
  }
  async save(record: CharacterRecord) {
    if (!isCharacterRecord(record)) throw new Error('corrupt-character-record');
    const records = this.read().filter((r) => r.build.id !== record.build.id);
    this.storage.setItem(RECORDS_KEY, JSON.stringify([...records, record]));
  }
  async delete(id: string) {
    if (id === 'reference') throw new Error('reference-record-protected');
    this.storage.setItem(
      RECORDS_KEY,
      JSON.stringify(this.read().filter((r) => r.build.id !== id)),
    );
  }
  async replaceAll(records: readonly CharacterRecord[]) {
    if (!records.every(isCharacterRecord))
      throw new Error('corrupt-character-record');
    this.storage.setItem(RECORDS_KEY, JSON.stringify(records));
  }
}
export class LocalCharacterDraftRepository implements CharacterDraftRepository {
  constructor(private readonly storage: KeyValueStorage) {}
  async loadDraft(): Promise<CharacterDraft | null> {
    try {
      const value: unknown = JSON.parse(
        this.storage.getItem(DRAFT_KEY) ?? 'null',
      );
      return object(value) &&
        value.schemaVersion === 1 &&
        typeof value.id === 'string'
        ? ({
            ...newCharacterDraft(value.id),
            ...value,
            startingEquipmentChoices: Array.isArray(
              value.startingEquipmentChoices,
            )
              ? value.startingEquipmentChoices
              : newCharacterDraft(value.id).startingEquipmentChoices,
            startingPurchaseCart: Array.isArray(value.startingPurchaseCart)
              ? value.startingPurchaseCart
              : [],
          } as unknown as CharacterDraft)
        : null;
    } catch {
      return null;
    }
  }
  async saveDraft(draft: CharacterDraft) {
    this.storage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }
  async deleteDraft() {
    this.storage.removeItem(DRAFT_KEY);
  }
}
