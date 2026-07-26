import { describe, expect, test } from 'vitest';
import { computeCharacter } from '../domain/character';
import {
  compareSpells,
  getAvailableClassCantrips,
  sortSpells,
} from '../domain/spells';
import { defaultRuleRegistry } from '../domain/rules';

describe('spell registry and selectors', () => {
  test('Thorn Whip is verified 2024 Druid rule data', () => {
    expect(defaultRuleRegistry.spells['thorn-whip']).toMatchObject({
      id: 'thorn-whip',
      name: 'Thorn Whip',
      level: 0,
      classIds: ['druid'],
      ritual: false,
      concentration: false,
      source: { ruleset: '5e-2024', verified: true },
    });
  });

  test('Druid cantrips come from verified class registry data at levels 1–8', () => {
    for (let characterLevel = 1; characterLevel <= 8; characterLevel += 1) {
      const spells = getAvailableClassCantrips({
        classId: 'druid',
        characterLevel,
        registry: defaultRuleRegistry,
      });
      expect(spells.map((spell) => spell.name)).toEqual([
        'Druidcraft',
        'Guidance',
        'Produce Flame',
        'Thorn Whip',
      ]);
      expect(spells.every((spell) => spell.level === 0)).toBe(true);
      expect(new Set(spells.map((spell) => spell.id)).size).toBe(spells.length);
      expect(spells).not.toContainEqual(
        defaultRuleRegistry.spells['acid-splash'],
      );
      expect(spells).not.toContainEqual(
        defaultRuleRegistry.spells['chill-touch'],
      );
    }
  });
});

describe('canonical spell ordering', () => {
  test('sorts immutably by level, name, then id', () => {
    const input = [
      { id: 'healing-word', name: 'Healing Word', level: 1 },
      { id: 'acid-splash', name: 'Acid Splash', level: 0 },
      { id: 'guidance', name: 'Guidance', level: 0 },
      { id: 'entangle', name: 'Entangle', level: 1 },
      { id: 'produce-flame', name: 'Produce Flame', level: 0 },
      { id: 'thorn-whip', name: 'Thorn Whip', level: 0 },
    ] as const;
    const result = sortSpells(input);
    expect(result.map((spell) => spell.name)).toEqual([
      'Acid Splash',
      'Guidance',
      'Produce Flame',
      'Thorn Whip',
      'Entangle',
      'Healing Word',
    ]);
    expect(input[0].name).toBe('Healing Word');
  });

  test('uses id as the deterministic tie-break for equal levels and names', () => {
    expect(
      compareSpells(
        { id: 'same-b', name: 'Same', level: 1 },
        { id: 'same-a', name: 'same', level: 1 },
      ),
    ).toBeGreaterThan(0);
  });

  test('resolved class, subclass, and species spells share canonical order', () => {
    const computed = computeCharacter(
      {
        id: 'spell-order',
        name: 'Spell Order',
        ruleset: '5e-2024',
        totalLevel: 3,
        abilityScores: {
          strength: 8,
          dexterity: 12,
          constitution: 14,
          intelligence: 10,
          wisdom: 15,
          charisma: 13,
        },
        savingThrowProficiencies: ['intelligence', 'wisdom'],
        skillProficiencies: ['nature', 'survival'],
        expertiseSkills: [],
        hitPointProgression: {
          hitDie: 8,
          levelGains: [
            { level: 1, baseHitPoints: 8 },
            { level: 2, baseHitPoints: 5 },
            { level: 3, baseHitPoints: 5 },
          ],
          perLevelBonuses: [],
          flatBonuses: [],
        },
        armorClassSources: [
          {
            type: 'unarmored',
            base: 10,
            abilityModifiers: ['dexterity'],
            label: 'Unarmored',
          },
        ],
        feats: [],
        class: {
          classId: 'druid',
          level: 3,
          subclassId: 'circle-of-the-land',
        },
        species: {
          speciesId: 'tiefling',
          optionId: 'chthonic',
          spellcastingAbility: 'wisdom',
        },
        backgroundId: 'farmer',
        featIds: ['tough'],
        cantripIds: ['thorn-whip', 'guidance'],
        preparedSpellIds: ['healing-word', 'entangle'],
        spellcasting: {
          ability: 'wisdom',
          slotProgression: { 3: { 1: 4, 2: 2 } },
        },
      },
      {
        currentHp: 10,
        temporaryHp: 0,
        spentHitDice: 0,
        spentSpellSlots: {},
        resources: {},
        conditions: [],
        selections: { circleOfTheLand: { landType: 'tropical' } },
      },
      defaultRuleRegistry,
    );
    expect(computed.spells.map((spell) => spell.name)).toEqual([
      'Acid Splash',
      'Chill Touch',
      'Guidance',
      'Thorn Whip',
      'Entangle',
      'False Life',
      'Healing Word',
      'Ray of Sickness',
      'Web',
    ]);
    expect(
      computed.spells.find((spell) => spell.name === 'Acid Splash'),
    ).toMatchObject({
      level: 0,
      sourceTypes: ['subclass'],
      alwaysPrepared: true,
    });
  });
});
