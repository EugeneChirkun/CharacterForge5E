import { createContext, useContext, useState, type ReactNode } from 'react';
import type {
  CharacterViewModel,
  StoredApplicationState,
} from '../features/characters/character.types';
import { loadState, saveState } from '../features/characters/characterStorage';
import { loadLocalCharacterRecords } from '../infrastructure/persistence/local-character-repository';
import { toCharacterViewModel } from '../features/characters/toCharacterViewModel';
import { defaultRuleRegistry } from '../domain/rules';
type Ctx = {
  state: StoredApplicationState;
  character: CharacterViewModel;
  update: (c: CharacterViewModel) => void;
  setMeta: (p: Partial<StoredApplicationState>) => void;
  remove: (id: string) => void;
};
const Context = createContext<Ctx | null>(null);
export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    const base = loadState();
    const created = Object.fromEntries(
      loadLocalCharacterRecords(localStorage).map((r) => [
        r.build.id,
        toCharacterViewModel(r.build, r.session, defaultRuleRegistry),
      ]),
    );
    return { ...base, characters: { ...base.characters, ...created } };
  });
  const update = (character: CharacterViewModel) =>
    setState((s) => {
      const n = {
        ...s,
        characters: { ...s.characters, [character.id]: character },
      };
      saveState(n);
      return n;
    });
  const setMeta = (p: Partial<StoredApplicationState>) =>
    setState((s) => {
      const n = { ...s, ...p };
      saveState(n);
      return n;
    });
  const remove = (id: string) =>
    setState((s) => {
      if (id === 'reference') return s;
      const characters = { ...s.characters };
      delete characters[id];
      const n = { ...s, characters };
      saveState(n);
      return n;
    });
  return (
    <Context.Provider
      value={{
        state,
        character: state.characters.reference,
        update,
        setMeta,
        remove,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCharacter() {
  const c = useContext(Context);
  if (!c) throw new Error('Character context missing');
  return c;
}
