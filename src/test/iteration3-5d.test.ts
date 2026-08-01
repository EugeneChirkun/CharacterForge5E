import { describe, expect, test } from 'vitest';
import { referenceBuild } from '../features/characters/referenceCharacter';
import { defaultRuleRegistry } from '../domain/rules';
import {
  evaluateFeatAvailability,
  generalFeatRegistry,
  listGeneralFeatAvailability,
  validateFeatSelection,
} from '../domain/feats';
import {
  CIRCLE_OF_THE_LAND_ID,
  circleOfTheLand,
  previewCircleLandTransition,
  resolveCircleSpells,
  validateSubclassChoice,
} from '../domain/subclasses';

describe('Iteration 3.5D registries', () => {
  test('general feat IDs are unique and deterministic', () => {
    expect(Object.keys(generalFeatRegistry)).toEqual([
      'resilient',
      'skill-expert',
      'tough',
    ]);
    expect(
      Object.values(generalFeatRegistry).every(
        (feat) => feat.source.verified && typeof feat.repeatable === 'boolean',
      ),
    ).toBe(true);
  });
  test('Farmer Tough is generically unavailable and deferred capabilities explain themselves', () => {
    expect(
      evaluateFeatAvailability(generalFeatRegistry.tough, referenceBuild, 4),
    ).toMatchObject({ status: 'unavailable', reasonCode: 'not-repeatable' });
    const options = listGeneralFeatAvailability(referenceBuild, 4);
    expect(
      options.find((entry) => entry.definition.id === 'weapon-master')
        ?.availability,
    ).toMatchObject({
      status: 'unavailable',
      message: expect.stringContaining('Weapon Mastery'),
    });
  });
  test('validates typed Resilient nested choices', () => {
    expect(
      validateFeatSelection(
        generalFeatRegistry.resilient,
        { ability: 'strength', savingThrow: 'strength' },
        referenceBuild,
        4,
      ),
    ).toEqual([]);
    expect(
      validateFeatSelection(
        generalFeatRegistry.resilient,
        {},
        referenceBuild,
        4,
      ).length,
    ).toBeGreaterThan(0);
  });
  test('installs one level-three Druid subclass and validates land', () => {
    expect(circleOfTheLand).toMatchObject({
      id: CIRCLE_OF_THE_LAND_ID,
      classId: 'druid',
      selectionLevel: 3,
    });
    expect(
      validateSubclassChoice({
        classId: 'druid',
        level: 3,
        subclassId: CIRCLE_OF_THE_LAND_ID,
        landId: 'temperate',
      }),
    ).toEqual([]);
    expect(validateSubclassChoice({ classId: 'druid', level: 2 })).toEqual([]);
  });
  test.each(['arid', 'polar', 'temperate', 'tropical'] as const)(
    'derives unique always-prepared %s spells through level 8',
    (land) => {
      for (let level = 3; level <= 8; level += 1) {
        const spells = resolveCircleSpells(defaultRuleRegistry, level, land);
        expect(new Set(spells.map((entry) => entry.spell.id)).size).toBe(
          spells.length,
        );
        expect(
          spells.every(
            (entry) =>
              entry.alwaysPrepared && !entry.countsAgainstPreparedLimit,
          ),
        ).toBe(true);
      }
    },
  );
  test('land transition reports removals and grants', () => {
    const preview = previewCircleLandTransition(
      defaultRuleRegistry,
      8,
      'temperate',
      'polar',
    );
    expect(preview.label).toBe('Temperate → Polar');
    expect(preview.removed.length).toBeGreaterThan(0);
    expect(preview.granted.length).toBeGreaterThan(0);
  });
});
