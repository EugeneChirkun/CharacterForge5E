import type {
  CharacterViewModel,
  StoredApplicationState,
} from './character.types';
import { freshReferenceCharacter } from './referenceCharacter';
export const STORAGE_KEY = 'character-forge-state-v1';
const defaults = (): StoredApplicationState => ({
  schemaVersion: 1,
  characters: { reference: freshReferenceCharacter() },
});
export function loadState(): StoredApplicationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const value: unknown = JSON.parse(raw);
    if (!isState(value)) return defaults();
    return value;
  } catch {
    return defaults();
  }
}
function isState(v: unknown): v is StoredApplicationState {
  if (!v || typeof v !== 'object') return false;
  const x = v as Record<string, unknown>;
  if (
    x.schemaVersion !== 1 ||
    !x.characters ||
    typeof x.characters !== 'object'
  )
    return false;
  const c = (x.characters as Record<string, unknown>).reference;
  return (
    !!c &&
    typeof c === 'object' &&
    (c as Record<string, unknown>).id === 'reference' &&
    Array.isArray((c as Record<string, unknown>).spellSlots) &&
    Array.isArray((c as Record<string, unknown>).resources)
  );
}
export function saveState(state: StoredApplicationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
export function saveCharacter(
  character: CharacterViewModel,
  patch: Partial<StoredApplicationState> = {},
) {
  const state = loadState();
  saveState({
    ...state,
    ...patch,
    characters: { ...state.characters, [character.id]: character },
  });
}
