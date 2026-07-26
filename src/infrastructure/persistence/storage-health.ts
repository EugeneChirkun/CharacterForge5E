import { inspectLocalCharacterRecords, RECORDS_KEY, type KeyValueStorage } from './local-character-repository';

export interface StorageHealth {
  readonly available: boolean;
  readonly writeTestPassed: boolean;
  readonly validCharacters: number;
  readonly corruptRecords: number;
  readonly schemaVersion: 2;
  readonly approximateBytes?: number;
  readonly error?: string;
}

export function checkStorageHealth(storage?: KeyValueStorage): StorageHealth {
  if (!storage) return { available: false, writeTestPassed: false, validCharacters: 0, corruptRecords: 0, schemaVersion: 2, error: 'Browser storage is unavailable.' };
  const key = 'character-forge-health-check';
  try {
    storage.setItem(key, 'ok');
    storage.removeItem(key);
    const records = inspectLocalCharacterRecords(storage);
    const serialized = storage.getItem(RECORDS_KEY) ?? '';
    return { available: true, writeTestPassed: true, validCharacters: records.valid.length, corruptRecords: records.corrupt.length, schemaVersion: 2, approximateBytes: new Blob([serialized]).size };
  } catch (cause) {
    return { available: true, writeTestPassed: false, validCharacters: 0, corruptRecords: 0, schemaVersion: 2, error: cause instanceof Error ? cause.name : 'Storage write failed.' };
  }
}

