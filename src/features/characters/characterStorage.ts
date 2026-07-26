import type {
  CharacterViewModel,
  StoredApplicationState,
} from './character.types';
import { freshReferenceCharacter } from './referenceCharacter';
export const STORAGE_KEY = 'character-forge-state-v2';
const defaults = (): StoredApplicationState => ({
  schemaVersion: 2,
  characters: { reference: freshReferenceCharacter() },
});
export function loadState(): StoredApplicationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const value: unknown = JSON.parse(raw);
    if (isState(value)) {
      const fallback = freshReferenceCharacter();
      return {
        ...value,
        characters: Object.fromEntries(
          Object.entries(value.characters).map(([id, character]) => [
            id,
            {
              ...character,
              skillProficiencies: character.skillProficiencies ?? [],
              proficiencies: character.proficiencies ?? fallback.proficiencies,
              languages: character.languages ?? fallback.languages,
              senses: character.senses ?? fallback.senses,
            },
          ]),
        ),
      };
    }
    if (isLegacyState(value)) {
      const fresh = defaults();
      const legacy = value.characters.reference;
      return {
        ...fresh,
        characters: {
          reference: {
            ...fresh.characters.reference,
            ...legacy,
            features: fresh.characters.reference.features,
            spells: fresh.characters.reference.spells,
            diagnostics: fresh.characters.reference.diagnostics,
          },
        },
      };
    }
    return defaults();
  } catch {
    return defaults();
  }
}
function isLegacyState(
  v: unknown,
): v is { schemaVersion: 1; characters: { reference: CharacterViewModel } } {
  if (!v || typeof v !== 'object') return false;
  const x = v as Record<string, unknown>;
  return (
    x.schemaVersion === 1 &&
    !!x.characters &&
    typeof x.characters === 'object' &&
    !!(x.characters as Record<string, unknown>).reference
  );
}
function isState(v: unknown): v is StoredApplicationState {
  if (!v || typeof v !== 'object') return false;
  const x = v as Record<string, unknown>;
  if (
    x.schemaVersion !== 2 ||
    !x.characters ||
    typeof x.characters !== 'object'
  )
    return false;
  const c = (x.characters as Record<string, unknown>).reference;
  return (
    !!c &&
    typeof c === 'object' &&
    (c as Record<string, unknown>).id === 'reference' &&
    !!(c as Record<string, unknown>).skills &&
    typeof (c as Record<string, unknown>).skills === 'object' &&
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
