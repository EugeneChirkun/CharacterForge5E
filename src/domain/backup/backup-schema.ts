import type { CharacterRecord } from '../../application/characters/character-repository';

export const BACKUP_FORMAT = 'characterforge5e-backup' as const;
export const BACKUP_VERSION = 1 as const;
export const BACKUP_LIMITS = {
  bytes: 5 * 1024 * 1024,
  characters: 100,
  nameLength: 200,
  notesLength: 10_000,
  inventoryInstances: 1_000,
} as const;

export interface CharacterForgeBackup {
  readonly format: typeof BACKUP_FORMAT;
  readonly version: typeof BACKUP_VERSION;
  readonly exportedAt: string;
  readonly applicationVersion: string;
  readonly characters: readonly CharacterRecord[];
}

export type ImportPolicy = 'replace' | 'keep-both' | 'skip';
export interface BackupDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly severity: 'warning' | 'error';
  readonly characterId?: string;
}

