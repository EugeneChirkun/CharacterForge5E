import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCharacter } from '../app/CharacterContext';
import type {
  CharacterViewModel,
  LandType,
} from '../features/characters/character.types';
import type { RestType } from '../features/rests/rest.types';
import { performRest, previewRest } from '../features/rests/restService';
import { CharacterHeader } from '../components/CharacterHeader';
import { Navigation, type Section, sections } from '../components/Navigation';
import { RestControls } from '../components/RestControls';
import { RestDialog } from '../components/RestDialog';
import {
  Actions,
  Features,
  Inventory,
  Spells,
  Summary,
} from '../components/Sections';
export function CharacterSheetPage() {
  const { character, update, state, setMeta } = useCharacter();
  const initial = sections.includes(state.lastSection as Section)
    ? (state.lastSection as Section)
    : 'summary';
  const [section, setSection] = useState<Section>(initial);
  const [rest, setRest] = useState<RestType | null>(null);
  const [restLand, setRestLand] = useState<LandType>(character.landType);
  const [undo, setUndo] = useState<CharacterViewModel | null>(null);
  const [toast, setToast] = useState('');
  const changeSection = (s: Section) => {
    setSection(s);
    setMeta({ lastSection: s });
  };
  const changeLand = (landType: LandType) => update({ ...character, landType });
  const startRest = (r: RestType) => {
    setRestLand(character.landType);
    setRest(r);
  };
  const confirm = () => {
    if (!rest) return;
    setUndo(character);
    update(performRest(rest, character, { landType: restLand }));
    setToast(`${rest === 'short' ? 'Short' : 'Long'} rest complete`);
    setRest(null);
  };
  const undoRest = () => {
    if (undo) {
      update(undo);
      setUndo(null);
      setToast('Rest undone');
    }
  };
  return (
    <div className="sheet-shell">
      <aside className="sidebar">
        <Link className="back" to="/">
          ← Characters
        </Link>
        <div className="sidebar-brand">CF</div>
        <Navigation active={section} onChange={changeSection} />
      </aside>
      <main className="sheet-main">
        <div className="desktop-top">
          <Link className="back" to="/">
            ← All characters
          </Link>
          <RestControls onRest={startRest} />
        </div>
        <CharacterHeader character={character} onLandChange={changeLand} />
        <div className="content">
          {section === 'summary' && <Summary c={character} />}{' '}
          {section === 'actions' && <Actions />}{' '}
          {section === 'spells' && <Spells c={character} onSlots={update} />}{' '}
          {section === 'features' && <Features c={character} />}{' '}
          {section === 'inventory' && <Inventory />}
        </div>
      </main>
      <div className="mobile-bars">
        <RestControls onRest={startRest} />
        <Navigation active={section} onChange={changeSection} />
      </div>
      {rest && (
        <RestDialog
          type={rest}
          preview={previewRest(rest, character)}
          land={restLand}
          onLand={setRestLand}
          close={() => setRest(null)}
          confirm={confirm}
        />
      )}{' '}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          {undo && <button onClick={undoRest}>Undo</button>}
          <button aria-label="Dismiss" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
