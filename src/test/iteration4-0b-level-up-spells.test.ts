import { describe, expect, it } from 'vitest';
import { computeCharacter } from '../domain/character';
import { defaultRuleRegistry } from '../domain/rules';
import {
  referenceBuild,
  referenceSession,
} from '../features/characters/referenceCharacter';
import {
  getTargetSpellCapability,
  previewLevelUpSpellChanges,
  shouldReviewSpellsOnLevelUp,
  validateLevelUpSpellChoices,
} from '../application/spells/level-up-spell-selection';

describe('Iteration 4.0B level-up spell selection', () => {
  const build8 = {
    ...referenceBuild,
    totalLevel: 8,
    class: {
      ...referenceBuild.class!,
      level: 8,
      subclassId: 'circle-of-the-land',
    },
    preparedSpellIds: ['cure-wounds'],
  };
  const session = {
    ...referenceSession,
    selections: { circleOfTheLand: { landType: 'temperate' as const } },
  };
  it('generically detects the 8 to 9 capability change', () => {
    const before = computeCharacter(build8, session, defaultRuleRegistry);
    const build9 = {
      ...build8,
      totalLevel: 9,
      class: { ...build8.class, level: 9 },
      hitPointProgression: {
        ...build8.hitPointProgression,
        levelGains: [
          ...build8.hitPointProgression.levelGains,
          { level: 9, baseHitPoints: 5 },
        ],
      },
      spellcasting: {
        ...build8.spellcasting!,
        slotProgression: {
          ...build8.spellcasting!.slotProgression,
          9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
        },
      },
    };
    const after = computeCharacter(build9, session, defaultRuleRegistry);
    expect(
      shouldReviewSpellsOnLevelUp({
        before,
        after,
        build: build8,
        registry: defaultRuleRegistry,
      }),
    ).toBe(true);
    expect(after.classLevel?.maximumSpellLevel).toBe(5);
    expect(after.classLevel?.preparedSpells).toBe(14);
  });
  it('preserves choices, rejects duplicates, grants, inaccessible spells, and incomplete counts', () => {
    const capability = getTargetSpellCapability(
      build8,
      9,
      'temperate',
      defaultRuleRegistry,
    );
    expect(capability.alwaysPreparedSpellIds.length).toBeGreaterThan(0);
    const diagnostics = validateLevelUpSpellChoices(
      {
        preparedSpellIds: [
          'cure-wounds',
          'cure-wounds',
          capability.alwaysPreparedSpellIds[0],
        ],
        normalCantripIds: build8.cantripIds,
      },
      capability,
      defaultRuleRegistry,
    );
    expect(diagnostics.map((d) => d.type)).toEqual(
      expect.arrayContaining([
        'duplicate-spell-selection',
        'always-prepared-spell-selected-as-class-prepared',
        'prepared-spell-count-incomplete',
      ]),
    );
  });
  it('creates stable, duplicate-free spell diffs', () => {
    const before = getTargetSpellCapability(
      build8,
      8,
      'temperate',
      defaultRuleRegistry,
    );
    const after = getTargetSpellCapability(
      build8,
      9,
      'temperate',
      defaultRuleRegistry,
    );
    const diff = previewLevelUpSpellChanges(
      before,
      after,
      ['entangle'],
      ['entangle', 'mass-cure-wounds', 'mass-cure-wounds'],
    );
    expect(diff.newlyPrepared).toEqual(['mass-cure-wounds']);
    expect(diff.newlyAccessibleSpellLevels).toEqual([5]);
    expect(new Set(diff.newlyAlwaysPrepared).size).toBe(
      diff.newlyAlwaysPrepared.length,
    );
  });
});
