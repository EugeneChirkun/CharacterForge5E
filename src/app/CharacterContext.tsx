import { createContext, useContext, useState, type ReactNode } from 'react';
import type {
  CharacterViewModel,
  StoredApplicationState,
} from '../features/characters/character.types';
import { loadState, saveState } from '../features/characters/characterStorage';
type Ctx = {
  state: StoredApplicationState;
  character: CharacterViewModel;
  update: (c: CharacterViewModel) => void;
  setMeta: (p: Partial<StoredApplicationState>) => void;
};
const Context = createContext<Ctx | null>(null);
export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState);
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
  return (
    <Context.Provider
      value={{ state, character: state.characters.reference, update, setMeta }}
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
