import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, test } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  filterSpells,
  groupSpells,
  searchSpells,
  sortSpellbookSpells,
  emptySpellbookFilters,
} from '../domain/spells';
import {
  selectSpellCards,
  selectSpellbook,
  togglePreparedSpell,
} from '../application/spellbook';
import { referenceCharacter } from '../features/characters/referenceCharacter';
import { CharacterProvider } from '../app/CharacterContext';
import { SpellbookPage } from '../features/spellbook/SpellbookPage';
import { SpellPreparationPanel } from '../features/spellbook/SpellPreparationPanel';

describe('spellbook domain and application', () => {
  const cards = selectSpellCards(referenceCharacter);
  it('searches, filters, sorts and groups immutable spell cards', () => {
    expect(searchSpells(cards, 'moon').map((spell) => spell.name)).toContain(
      'Moonbeam',
    );
    expect(
      filterSpells(cards, { ...emptySpellbookFilters, ritual: true }).every(
        (spell) => spell.ritual,
      ),
    ).toBe(true);
    expect(sortSpellbookSpells(cards, 'level')[0].level).toBe(0);
    expect(groupSpells(cards)[0].label).toBe('Cantrips');
  });
  it('builds preparation and slot summaries and reuses validation', () => {
    const view = selectSpellbook(
      referenceCharacter,
      { search: '', filters: emptySpellbookFilters, sort: 'level' },
      'guidance',
    );
    expect(view.selected?.name).toBe('Guidance');
    expect(view.slots[0].remaining).toBe(
      referenceCharacter.spellSlots[0].current,
    );
    const without = {
      ...referenceCharacter,
      preparedSpellIds: referenceCharacter.preparedSpellIds?.filter(
        (id) => id !== 'goodberry',
      ),
    };
    expect(
      togglePreparedSpell(without, 'fog-cloud').preparedSpellIds,
    ).toContain('fog-cloud');
  });
});

describe('SpellbookPage', () => {
  const page = () =>
    render(
      <CharacterProvider>
        <MemoryRouter initialEntries={['/character/reference/spellbook']}>
          <Routes>
            <Route
              path="/character/:id/spellbook"
              element={<SpellbookPage />}
            />
          </Routes>
        </MemoryRouter>
      </CharacterProvider>,
    );
  it('searches, filters, opens detail, and changes a slot', () => {
    page();
    fireEvent.change(screen.getByPlaceholderText('Search spells'), {
      target: { value: 'Guidance' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Inspect Guidance/ }));
    expect(screen.getByText('Spell details')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search spells'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cantrips' }));
    expect(
      screen.queryByRole('button', { name: /Inspect Moonbeam/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Spend' })[0]);
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });
});

describe('categorized preparation diagnostics', () => {
  test('excludes build codes and renders genuine preparation messages', () => {
    const view = selectSpellbook({
      ...referenceCharacter,
      diagnostics: ['missing-primal-order', 'too-many-prepared-spells'],
      diagnosticGroups: {
        build: ['missing-primal-order'],
        spellPreparation: ['too-many-prepared-spells'],
        session: [],
      },
    }, { search: '', filters: emptySpellbookFilters, sort: 'level' });
    render(<SpellPreparationPanel view={view} />);
    expect(screen.getByText('Validation messages (1)')).toBeInTheDocument();
    expect(screen.getByText('Too many Druid spells are prepared.')).toBeInTheDocument();
    expect(screen.queryByText('missing-primal-order')).not.toBeInTheDocument();
  });
});
