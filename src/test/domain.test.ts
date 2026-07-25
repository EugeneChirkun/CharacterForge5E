import { describe, expect, test } from 'vitest';
import { abilityNames, getAbilityModifier } from '../domain/abilities';
import { calculateArmorClass } from '../domain/armor-class';
import { computeCharacter, updateCharacterSession } from '../domain/character';
import {
  calculateInitiative,
  calculatePassivePerception,
  calculateSavingThrow,
} from '../domain/character/statistics';
import { calculateMaximumHp } from '../domain/hit-points';
import { getProficiencyBonus } from '../domain/proficiency';
import {
  calculateSkillModifier,
  skillNames,
  skillToAbility,
} from '../domain/skills';
import {
  calculateSpellAttackBonus,
  calculateSpellSaveDc,
  calculateSpellSlots,
} from '../domain/spellcasting';
import {
  referenceBuild,
  referenceSession,
} from '../features/characters/referenceCharacter';

describe('ability modifiers', () => {
  test.each([
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [14, 2],
    [17, 3],
    [20, 5],
  ])('score %i is %i', (score, modifier) =>
    expect(getAbilityModifier(score).value).toBe(modifier),
  );
  test.each([0, 31, 10.5, Number.NaN])('rejects invalid score %s', (score) =>
    expect(() => getAbilityModifier(score)).toThrow(/score/i),
  );
});
describe('proficiency', () => {
  test.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('level %i is %i', (level, bonus) =>
    expect(getProficiencyBonus(level).value).toBe(bonus),
  );
  test.each([0, 21, 1.5])('rejects level %s', (level) =>
    expect(() => getProficiencyBonus(level)).toThrow(/level/i),
  );
});
describe('skills', () => {
  test('defines every standard skill with its standard ability', () => {
    expect(skillNames).toHaveLength(18);
    expect(skillToAbility).toEqual({
      acrobatics: 'dexterity',
      animalHandling: 'wisdom',
      arcana: 'intelligence',
      athletics: 'strength',
      deception: 'charisma',
      history: 'intelligence',
      insight: 'wisdom',
      intimidation: 'charisma',
      investigation: 'intelligence',
      medicine: 'wisdom',
      nature: 'intelligence',
      perception: 'wisdom',
      performance: 'charisma',
      persuasion: 'charisma',
      religion: 'intelligence',
      sleightOfHand: 'dexterity',
      stealth: 'dexterity',
      survival: 'wisdom',
    });
  });
  test.each([
    [false, false, 2],
    [true, false, 5],
    [true, true, 8],
  ])('proficiency states', (proficient, expertise, value) =>
    expect(
      calculateSkillModifier({
        skill: 'stealth',
        abilityModifier: 2,
        proficiencyBonus: 3,
        proficient,
        expertise,
      }).value,
    ).toBe(value),
  );
  test('rejects expertise without proficiency', () =>
    expect(() =>
      calculateSkillModifier({
        skill: 'arcana',
        abilityModifier: 0,
        proficiencyBonus: 3,
        proficient: false,
        expertise: true,
      }),
    ).toThrow(/expertise/i));
});
describe('generic statistics', () => {
  test('saving throws support proficiency and flat sources', () => {
    expect(
      calculateSavingThrow({
        abilityModifier: 2,
        proficiencyBonus: 3,
        proficient: false,
      }).value,
    ).toBe(2);
    expect(
      calculateSavingThrow({
        abilityModifier: 2,
        proficiencyBonus: 3,
        proficient: true,
        modifiers: [{ source: 'Blessing', amount: 1 }],
      }).value,
    ).toBe(6);
  });
  test('initiative supports Dexterity and flat modifiers', () => {
    expect(calculateInitiative({ dexterityModifier: 2 }).value).toBe(2);
    expect(
      calculateInitiative({
        dexterityModifier: 2,
        modifiers: [{ source: 'Alert', amount: 3 }],
      }).value,
    ).toBe(5);
  });
  test('passive Perception uses either skill result', () => {
    expect(
      calculatePassivePerception(
        calculateSkillModifier({
          skill: 'perception',
          abilityModifier: 5,
          proficiencyBonus: 3,
          proficient: false,
          expertise: false,
        }),
      ).value,
    ).toBe(15);
    expect(
      calculatePassivePerception(
        calculateSkillModifier({
          skill: 'perception',
          abilityModifier: 5,
          proficiencyBonus: 3,
          proficient: true,
          expertise: false,
        }),
      ).value,
    ).toBe(18);
  });
});
describe('armor class', () => {
  const mods = {
    strength: -1,
    dexterity: 4,
    constitution: 2,
    intelligence: 0,
    wisdom: 3,
    charisma: 0,
  } as const;
  test('supports unarmored formulas', () =>
    expect(
      calculateArmorClass({
        abilityModifiers: mods,
        sources: [
          {
            type: 'unarmored',
            base: 10,
            abilityModifiers: ['dexterity', 'wisdom'],
            label: 'Defense',
          },
        ],
      }).value,
    ).toBe(17));
  test('supports full and capped Dexterity armor', () => {
    expect(
      calculateArmorClass({
        abilityModifiers: mods,
        sources: [{ type: 'armor', base: 12, label: 'Light' }],
      }).value,
    ).toBe(16);
    expect(
      calculateArmorClass({
        abilityModifiers: mods,
        sources: [
          { type: 'armor', base: 14, dexterityCap: 2, label: 'Medium' },
        ],
      }).value,
    ).toBe(16);
  });
  test('selects highest base and adds shield and flat bonuses', () =>
    expect(
      calculateArmorClass({
        abilityModifiers: mods,
        sources: [
          {
            type: 'unarmored',
            base: 10,
            abilityModifiers: ['dexterity'],
            label: 'Unarmored',
          },
          { type: 'armor', base: 14, dexterityCap: 2, label: 'Armor' },
          { type: 'shield', amount: 2, label: 'Shield' },
          { type: 'flat-bonus', amount: 1, label: 'Magic' },
        ],
      }).value,
    ).toBe(19));
  test('rejects missing base', () =>
    expect(() =>
      calculateArmorClass({ abilityModifiers: mods, sources: [] }),
    ).toThrow(/base formula/i));
});
describe('hit points', () => {
  const progression = referenceBuild.hitPointProgression;
  test('calculates level one and the complete reference progression', () => {
    expect(
      calculateMaximumHp({
        level: 1,
        constitutionModifier: 3,
        progression: {
          ...progression,
          levelGains: [{ level: 1, baseHitPoints: 8 }],
        },
      }).value,
    ).toBe(13);
    const result = calculateMaximumHp({
      level: 8,
      constitutionModifier: 3,
      progression,
    });
    expect(result.value).toBe(83);
    expect(result.steps.map((s) => s.value)).toEqual([8, 35, 24, 16]);
  });
  test('applies Constitution retroactively', () =>
    expect(
      calculateMaximumHp({ level: 8, constitutionModifier: 4, progression })
        .value,
    ).toBe(91));
  test('rejects missing and duplicate gains', () => {
    expect(() =>
      calculateMaximumHp({
        level: 8,
        constitutionModifier: 3,
        progression: {
          ...progression,
          levelGains: progression.levelGains.slice(1),
        },
      }),
    ).toThrow(/missing/i);
    expect(() =>
      calculateMaximumHp({
        level: 8,
        constitutionModifier: 3,
        progression: {
          ...progression,
          levelGains: [...progression.levelGains, progression.levelGains[0]],
        },
      }),
    ).toThrow(/duplicate/i);
  });
});
describe('spellcasting', () => {
  test('calculates spell modifiers with explanations', () => {
    expect(
      calculateSpellSaveDc({ proficiencyBonus: 3, abilityModifier: 5 }).value,
    ).toBe(16);
    expect(
      calculateSpellAttackBonus({ proficiencyBonus: 3, abilityModifier: 5 })
        .value,
    ).toBe(8);
  });
  test('projects maximum, spent and remaining slots', () => {
    const slots = calculateSpellSlots({
      level: 8,
      progression: referenceBuild.spellcasting!.slotProgression,
      spent: { 1: 2 },
    });
    expect(slots[1]).toEqual({ level: 1, maximum: 4, spent: 2, remaining: 2 });
    expect(slots[4].remaining).toBe(2);
  });
  test('rejects overspending', () =>
    expect(() =>
      calculateSpellSlots({
        level: 8,
        progression: referenceBuild.spellcasting!.slotProgression,
        spent: { 4: 3 },
      }),
    ).toThrow(/invalid spent/i));
});
describe('character computation', () => {
  test('computes the full reference fixture', () => {
    const c = computeCharacter(referenceBuild, referenceSession);
    expect(abilityNames.map((name) => c.abilityModifiers[name].value)).toEqual([
      -1, 2, 3, 0, 5, -1,
    ]);
    expect(c.proficiencyBonus.value).toBe(3);
    expect(c.maximumHp.value).toBe(83);
    expect(c.armorClass.value).toBe(16);
    expect(c.initiative.value).toBe(2);
    expect(c.passivePerception.value).toBe(18);
    expect(c.spellcasting?.spellSaveDc.value).toBe(16);
    expect(c.spellcasting?.spellAttackBonus.value).toBe(8);
    expect(
      Object.values(c.spellcasting!.slots).map((s) => [s.maximum, s.remaining]),
    ).toEqual([
      [4, 2],
      [3, 1],
      [3, 2],
      [2, 0],
    ]);
    expect(c.savingThrows.wisdom.value).toBe(8);
    expect(c.skills.nature.value).toBe(3);
  });
  test('validates session HP and updates immutably', () => {
    expect(() =>
      computeCharacter(referenceBuild, { ...referenceSession, currentHp: 84 }),
    ).toThrow(/current HP/i);
    const next = updateCharacterSession(referenceSession, {
      currentHp: 40,
      conditions: ['prone'],
    });
    expect(next).not.toBe(referenceSession);
    expect(next.currentHp).toBe(40);
    expect(referenceSession.conditions).toEqual([]);
  });
});
