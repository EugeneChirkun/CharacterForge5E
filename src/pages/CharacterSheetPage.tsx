import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import {
  SessionControls,
  type SessionActions,
} from '../components/SessionControls';
import type { ConditionId } from '../application/session';
export function CharacterSheetPage() {
  const { id = 'reference' } = useParams();
  const context = useCharacter();
  const { update, state, setMeta } = context;
  const missing = !state.characters[id];
  const character = state.characters[id] ?? state.characters.reference;
  const initial = sections.includes(state.lastSection as Section)
    ? (state.lastSection as Section)
    : 'summary';
  const [section, setSection] = useState<Section>(initial);
  const [rest, setRest] = useState<RestType | null>(null);
  const [restLand, setRestLand] = useState<LandType>(character.landType);
  const [undo, setUndo] = useState<CharacterViewModel | null>(null);
  const [toast, setToast] = useState('');
  const [sessionUndo, setSessionUndo] = useState<CharacterViewModel | null>(
    null,
  );
  const [history, setHistory] = useState<readonly string[]>([]);
  const [error, setError] = useState('');
  if (missing)
    return (
      <main className="center-page">
        <h1>Character not found</h1>
        <Link to="/characters">Return to characters</Link>
      </main>
    );
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
  const execute = (next: () => CharacterViewModel, message: string) => {
    try {
      const value = next();
      setSessionUndo(character);
      update(value);
      setHistory((h) => [message, ...h]);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Session change failed.');
    }
  };
  const requireWhole = (value: number, name: string) => {
    if (!Number.isInteger(value) || value < 0)
      throw new Error(`${name} must be a non-negative whole number.`);
  };
  const actions: SessionActions = {
    damage: (amount) =>
      execute(() => {
        requireWhole(amount, 'Damage');
        const absorbed = Math.min(character.temporaryHp, amount);
        return {
          ...character,
          temporaryHp: character.temporaryHp - absorbed,
          currentHp: Math.max(0, character.currentHp - amount + absorbed),
        };
      }, `Took ${amount} damage`),
    heal: (amount) =>
      execute(() => {
        requireWhole(amount, 'Healing');
        if (character.currentHp + amount > character.maximumHp)
          throw new Error('Healing would exceed maximum HP.');
        return { ...character, currentHp: character.currentHp + amount };
      }, `Recovered ${amount} HP`),
    setHp: (value) =>
      execute(() => {
        requireWhole(value, 'Current HP');
        if (value > character.maximumHp)
          throw new Error('Current HP cannot exceed maximum HP.');
        return { ...character, currentHp: value };
      }, `Set HP to ${value}`),
    setTempHp: (value) =>
      execute(() => {
        requireWhole(value, 'Temporary HP');
        return { ...character, temporaryHp: value };
      }, `Set temporary HP to ${value}`),
    clearTempHp: () =>
      execute(() => ({ ...character, temporaryHp: 0 }), 'Cleared temporary HP'),
    spendSlot: (level) =>
      execute(
        () => ({
          ...character,
          spellSlots: character.spellSlots.map((s) =>
            s.level === level && s.current > 0
              ? { ...s, current: s.current - 1 }
              : s,
          ),
        }),
        `Spent Level ${level} Slot`,
      ),
    restoreSlot: (level) =>
      execute(
        () => ({
          ...character,
          spellSlots: character.spellSlots.map((s) =>
            s.level === level && s.current < s.maximum
              ? { ...s, current: s.current + 1 }
              : s,
          ),
        }),
        `Restored Level ${level} Slot`,
      ),
    spendResource: (resourceId) =>
      execute(
        () => ({
          ...character,
          resources: character.resources.map((r) =>
            r.id === resourceId && r.current > 0
              ? { ...r, current: r.current - 1 }
              : r,
          ),
        }),
        `Used ${character.resources.find((r) => r.id === resourceId)?.name ?? resourceId}`,
      ),
    restoreResource: (resourceId) =>
      execute(
        () => ({
          ...character,
          resources: character.resources.map((r) =>
            r.id === resourceId && r.current < r.maximum
              ? { ...r, current: r.current + 1 }
              : r,
          ),
        }),
        `Restored ${character.resources.find((r) => r.id === resourceId)?.name ?? resourceId}`,
      ),
    setCondition: (condition: ConditionId, active) =>
      execute(
        () => ({
          ...character,
          conditions: active
            ? [...new Set([...(character.conditions ?? []), condition])]
            : (character.conditions ?? []).filter((x) => x !== condition),
        }),
        `${active ? 'Applied' : 'Removed'} ${condition}`,
      ),
    startConcentration: (spellId) =>
      execute(
        () => ({ ...character, concentrationSpellId: spellId }),
        'Started Concentration',
      ),
    endConcentration: () =>
      execute(
        () => ({ ...character, concentrationSpellId: undefined }),
        'Ended Concentration',
      ),
    undo: () => {
      if (!sessionUndo) {
        setError('There is no session change to undo.');
        return;
      }
      update(sessionUndo);
      setSessionUndo(null);
      setHistory((h) => ['Undid last session change', ...h]);
    },
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
          {id !== 'reference' && character.level < 8 && (
            <Link className="button" to={`/character/${id}/level-up`}>
              Level Up
            </Link>
          )}
          {id !== 'reference' && character.level >= 8 && (
            <span>Maximum level reached</span>
          )}
        </div>
        <CharacterHeader character={character} onLandChange={changeLand} />
        <div className="content">
          {section === 'summary' && (
            <>
              <Summary c={character} />
              <SessionControls
                c={character}
                actions={actions}
                error={error}
                history={history}
              />
            </>
          )}{' '}
          {section === 'actions' && <Actions />}{' '}
          {section === 'spells' && (
            <Spells
              c={character}
              onSlots={update}
              onSpendSlot={actions.spendSlot}
              onRestoreSlot={actions.restoreSlot}
            />
          )}{' '}
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
