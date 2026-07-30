import type { CharacterBuild, CharacterSession } from '../../domain/character';
import type { CharacterDraft } from '../../domain/creation';
export interface CharacterRecord {
  readonly schemaVersion: 2 | 3 | 4;
  readonly build: CharacterBuild;
  readonly session: CharacterSession;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CharacterRepository {
  list(): Promise<readonly CharacterRecord[]>;
  get(id: string): Promise<CharacterRecord | null>;
  save(record: CharacterRecord): Promise<void>;
  delete(id: string): Promise<void>;
  replaceAll?(records: readonly CharacterRecord[]): Promise<void>;
}
export interface CharacterDraftRepository {
  loadDraft(): Promise<CharacterDraft | null>;
  saveDraft(draft: CharacterDraft): Promise<void>;
  deleteDraft(): Promise<void>;
}
