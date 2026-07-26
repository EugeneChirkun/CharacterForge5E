import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCharacter } from '../../app/CharacterContext';
import {
  restoreSlot,
  selectSpellbook,
  spendSlot,
  togglePreparedSpell,
} from '../../application/spellbook';
import {
  emptySpellbookFilters,
  type SpellbookFilters,
  type SpellbookSort,
} from '../../domain/spells';
import { SpellSearch } from './SpellSearch';
import { SpellFilterBar } from './SpellFilterBar';
import { SpellGroup } from './SpellGroup';
import { SpellDetailPanel } from './SpellDetailPanel';
import { SpellSlotSummary } from './SpellSlotSummary';
import { SpellPreparationPanel } from './SpellPreparationPanel';

export function SpellbookPage() {
  const { id = 'reference' } = useParams();
  const { state, update } = useCharacter();
  const character = state.characters[id];
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SpellbookFilters>(
    emptySpellbookFilters,
  );
  const [sort, setSort] = useState<SpellbookSort>('level');
  const [selected, setSelected] = useState<string>();
  const [error, setError] = useState('');
  const view = useMemo(
    () =>
      character
        ? selectSpellbook(character, { search, filters, sort }, selected)
        : undefined,
    [character, search, filters, sort, selected],
  );
  if (!character || !view)
    return (
      <main className="center-page">
        <h1>Character not found</h1>
        <Link to="/characters">Return to characters</Link>
      </main>
    );
  const change = (operation: () => typeof character) => {
    try {
      update(operation());
      setError('');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Spellbook change failed.',
      );
    }
  };
  return (
    <main className="spellbook-page">
      <header className="spellbook-heading">
        <div>
          <Link className="back" to={`/character/${id}`}>
            ← Character sheet
          </Link>
          <p className="eyebrow">{character.name}</p>
          <h1>Spellbook</h1>
        </div>
        <p>{view.resultCount} spells shown</p>
      </header>
      <SpellSlotSummary
        slots={view.slots}
        onSpend={(level) => change(() => spendSlot(character, level))}
        onRestore={(level) => change(() => restoreSlot(character, level))}
      />
      <SpellPreparationPanel view={view} />
      {error && (
        <p className="spellbook-error" role="alert">
          {error}
        </p>
      )}
      <SpellSearch value={search} onChange={setSearch} />
      <SpellFilterBar
        filters={filters}
        sort={sort}
        onFilters={setFilters}
        onSort={setSort}
      />
      <div className="spellbook-layout">
        <div>
          {view.groups.length ? (
            view.groups.map((group) => (
              <SpellGroup
                key={group.level}
                group={group}
                selected={selected}
                onSelect={setSelected}
                onToggle={(spellId) =>
                  change(() => togglePreparedSpell(character, spellId))
                }
              />
            ))
          ) : (
            <p className="panel">
              No spells match these search and filter settings.
            </p>
          )}
        </div>
        <SpellDetailPanel spell={view.selected} />
      </div>
    </main>
  );
}
