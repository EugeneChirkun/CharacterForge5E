import type {
  CharacterDraftRepository,
  CharacterRecord,
  CharacterRepository,
} from '../../application/characters/character-repository';
import type { CharacterDraft } from '../../domain/creation';
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
const RECORDS_KEY = 'character-forge-records-v1';
const DRAFT_KEY = 'character-forge-creation-draft-v1';
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object';
export function isCharacterRecord(v: unknown): v is CharacterRecord {
  return (
    object(v) &&
    v.schemaVersion === 1 &&
    object(v.build) &&
    typeof v.build.id === 'string' &&
    v.build.id !== 'reference' &&
    object(v.session) &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string'
  );
}
export function migrateRecords(value: unknown): readonly CharacterRecord[] {
  return Array.isArray(value) ? value.filter(isCharacterRecord) : [];
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
        ? (value as unknown as CharacterDraft)
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
