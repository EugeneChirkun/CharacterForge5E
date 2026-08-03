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
import { Actions, Features, Spells, Summary } from '../components/Sections';
import {
  SessionControls,
  type SessionActions,
} from '../components/SessionControls';
import { EquipmentPage } from '../features/equipment/EquipmentPage';
import type { ConditionId } from '../application/session';
import { ActiveCharacterStateCard } from '../components/ActiveCharacterStateCard';
import {
  damageView,
  healView,
  previewTransformation,
  revertView,
  transformView,
  type TransformationPreview,
} from '../application/wild-shape/wild-shape';
import { beastRegistry } from '../domain/character-state';
import { characterStateDiagnosticMessage } from '../application/wild-shape/diagnostics';
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
  const [shapePicker, setShapePicker] = useState(false);
  const [shapePreview, setShapePreview] =
    useState<TransformationPreview | null>(null);
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
      setError(characterStateDiagnosticMessage(e));
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
        const afterTemp = {
          ...character,
          temporaryHp: character.temporaryHp - absorbed,
        };
        return damageView(afterTemp, amount - absorbed);
      }, `Took ${amount} damage`),
    heal: (amount) =>
      execute(() => {
        requireWhole(amount, 'Healing');
        if (
          character.characterState.type === 'normal' &&
          character.currentHp + amount > character.maximumHp
        )
          throw new Error('Healing would exceed maximum HP.');
        return healView(character, amount);
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
    adjustMaximumHp: (delta, reason) =>
      execute(
        () => {
          const adjustment = (character.maximumHpAdjustment ?? 0) + delta;
          const effective =
            (character.baseMaximumHp ?? character.maximumHp) + adjustment;
          if (effective < 0)
            throw new Error('Effective Maximum HP cannot be below zero.');
          return {
            ...character,
            maximumHpAdjustment: adjustment,
            maximumHpAdjustmentReason: reason?.trim() || undefined,
            maximumHp: effective,
            currentHp: Math.min(character.currentHp, effective),
          };
        },
        `${delta < 0 ? 'Decreased' : 'Increased'} Maximum HP adjustment`,
      ),
    resetMaximumHpAdjustment: () =>
      execute(
        () => ({
          ...character,
          maximumHpAdjustment: 0,
          maximumHpAdjustmentReason: undefined,
          maximumHp: character.baseMaximumHp ?? character.maximumHp,
        }),
        'Reset Maximum HP adjustment',
      ),
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
          <button
            type="button"
            className="secondary print-hidden"
            onClick={() => window.print()}
          >
            Print Character
          </button>
          <Link className="button" to={`/character/${id}/spellbook`}>
            Open Spellbook
          </Link>
          {id !== 'reference' && character.level < 8 && (
            <Link className="button" to={`/character/${id}/level-up`}>
              Level Up
            </Link>
          )}
          {id !== 'reference' && character.level >= 8 && (
            <span>Maximum level reached</span>
          )}
        </div>
        <CharacterHeader character={character} />
        <ActiveCharacterStateCard
          activeState={{
            state: character.characterState,
            beast:
              character.characterState.type === 'wild-shape'
                ? beastRegistry[character.characterState.payload.beastId]
                : undefined,
            uses:
              character.resources.find((r) => r.id === 'wild-shape')?.current ??
              0,
          }}
          onTransform={() => setShapePicker(true)}
          onRevert={() =>
            execute(() => revertView(character), 'Ended Wild Shape')
          }
        />
        <div className="content">
          {section === 'summary' && (
            <>
              <p>
                <Link className="button" to={`/character/${id}/spellbook`}>
                  Open Spellbook
                </Link>
              </p>
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
          {section === 'inventory' && (
            <EquipmentPage character={character} onChange={update} />
          )}
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
      {shapePicker && (
        <div className="dialog-backdrop">
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Choose Wild Shape form"
          >
            <h2>Choose a Beast</h2>
            {character.availableWildShapeForms.map((beast) => (
              <button
                className="beast-choice"
                key={beast.id}
                onClick={() =>
                  setShapePreview(previewTransformation(character, beast.id))
                }
              >
                <strong>{beast.name}</strong>
                <span>
                  CR {beast.challengeRating} · AC {beast.armorClass} · HP{' '}
                  {beast.hitPoints}
                </span>
              </button>
            ))}
            <button
              className="secondary"
              onClick={() => {
                setShapePicker(false);
                setShapePreview(null);
              }}
            >
              Cancel
            </button>
          </section>
        </div>
      )}
      {shapePreview && (
        <div className="dialog-backdrop">
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Wild Shape transformation preview"
          >
            <h2>Transformation Preview</h2>
            <p>
              Current Character ↓ <strong>{shapePreview.beastName}</strong> ↓
              Changes
            </p>
            <dl className="preview-changes">
              {shapePreview.changes.map((x) => (
                <div key={x.label}>
                  <dt>{x.label}</dt>
                  <dd>
                    {x.before} → {x.after}
                  </dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => {
                execute(
                  () => transformView(character, shapePreview.beastId),
                  'Transformed with Wild Shape',
                );
                setShapePicker(false);
                setShapePreview(null);
              }}
            >
              Confirm Transformation
            </button>
            <button className="secondary" onClick={() => setShapePreview(null)}>
              Back
            </button>
          </section>
        </div>
      )}
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
