import { describe, expect, test } from 'vitest';
import { getProficiencyBonus } from '../domain/proficiency';
import {
  defaultRuleRegistry,
  SUPPORTED_DRUID_LEVEL_RANGE,
} from '../domain/rules';
import {
  calculateSpellAttackBonus,
  calculateSpellSaveDc,
} from '../domain/spellcasting';
import { getAvailableClassSpells, maximumSpellLevel } from '../domain/spells';
import { resolveCircleSpells } from '../domain/subclasses';

describe('Iteration 3.6 Druid level 9', () => {
  test('installs exactly the verified level-9 progression without a feature', () => {
    const level8 = defaultRuleRegistry.classes.druid.progression.find(
      (row) => row.level === 8,
    )!;
    const level9 = defaultRuleRegistry.classes.druid.progression.find(
      (row) => row.level === 9,
    )!;
    expect(SUPPORTED_DRUID_LEVEL_RANGE).toEqual({ minimum: 1, maximum: 9 });
    expect(level8.spellSlots).toEqual({ 1: 4, 2: 3, 3: 3, 4: 2 });
    expect(level9).toMatchObject({
      cantripsKnown: 3,
      preparedSpells: 14,
      spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      resourceMaximums: { 'wild-shape': 3 },
      featureIds: [],
    });
    expect(maximumSpellLevel(level9.spellSlots)).toBe(5);
  });

  test('uses generic proficiency and spellcasting calculations', () => {
    expect(getProficiencyBonus(8).value).toBe(3);
    expect(getProficiencyBonus(9).value).toBe(4);
    expect(
      calculateSpellSaveDc({ proficiencyBonus: 4, abilityModifier: 5 }).value,
    ).toBe(17);
    expect(
      calculateSpellAttackBonus({ proficiencyBonus: 4, abilityModifier: 5 })
        .value,
    ).toBe(9);
  });

  test('gates level-5 class spells at level 9', () => {
    const available = (characterLevel: number) =>
      getAvailableClassSpells({
        classId: 'druid',
        characterLevel,
        registry: defaultRuleRegistry,
      });
    expect(available(8).some((spell) => spell.level === 5)).toBe(false);
    expect(available(9).some((spell) => spell.id === 'wall-of-stone')).toBe(
      true,
    );
  });

  test.each([
    ['arid', 'wall-of-stone'],
    ['polar', 'cone-of-cold'],
    ['temperate', 'tree-stride'],
    ['tropical', 'insect-plague'],
  ] as const)('activates the %s level-9 Circle grant', (land, spellId) => {
    expect(
      resolveCircleSpells(defaultRuleRegistry, 8, land).some(
        (grant) => grant.spell.id === spellId,
      ),
    ).toBe(false);
    expect(resolveCircleSpells(defaultRuleRegistry, 9, land)).toContainEqual(
      expect.objectContaining({
        spell: expect.objectContaining({ id: spellId, level: 5 }),
        alwaysPrepared: true,
        countsAgainstPreparedLimit: false,
      }),
    );
  });
});
