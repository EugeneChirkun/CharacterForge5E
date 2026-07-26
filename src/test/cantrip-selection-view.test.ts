import { describe, expect, test } from 'vitest';
import { createCantripSelectionView } from '../application/characters/cantrip-selection-view';
import { defaultRuleRegistry } from '../domain/rules';

const cantrips = Object.values(defaultRuleRegistry.spells).filter(
  (spell) => spell.level === 0 && spell.classIds.includes('druid'),
);

describe('cantrip selection view', () => {
  test('keeps the Magician grant sourced, checked, disabled, and outside the normal quota', () => {
    const view = createCantripSelectionView(
      cantrips,
      ['guidance', 'thorn-whip'],
      2,
      'produce-flame',
    );
    expect(
      view.options.find((option) => option.spellId === 'produce-flame'),
    ).toMatchObject({
      checked: true,
      disabled: true,
      selectionSource: 'magician',
      sourceLabel: 'Granted by Primal Order: Magician',
    });
    expect(view.summary).toEqual({
      normalSelected: 2,
      normalLimit: 2,
      grantedCount: 1,
      totalKnown: 3,
    });
  });

  test('rejects duplicate ownership instead of silently deduplicating invalid input', () => {
    expect(() =>
      createCantripSelectionView(
        cantrips,
        ['produce-flame'],
        2,
        'produce-flame',
      ),
    ).toThrow('duplicate-cantrip-selection');
  });

  test('removes stale grant state when switching to Warden', () => {
    const view = createCantripSelectionView(cantrips, ['guidance'], 2);
    expect(view.summary).toMatchObject({
      normalSelected: 1,
      grantedCount: 0,
      totalKnown: 1,
    });
    expect(
      view.options.find((option) => option.spellId === 'produce-flame'),
    ).toMatchObject({
      checked: false,
      disabled: false,
      selectionSource: undefined,
    });
  });
});
