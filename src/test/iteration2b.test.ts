import { describe, expect, test } from 'vitest';
import { computeCharacter } from '../domain/character';
import { spendResource } from '../domain/resources';
import {
  performLongRest,
  performShortRest,
  previewShortRest,
} from '../domain/rest';
import { defaultRuleRegistry } from '../domain/rules';
import { activeSpellGrants, validatePreparedSpells } from '../domain/spells';
import {
  referenceBuild,
  referenceSession,
} from '../features/characters/referenceCharacter';

describe('verified Druid progression', () => {
  test.each([
    [1, 1, 2, 4],
    [2, 1, 2, 5],
    [3, 2, 2, 6],
    [4, 2, 3, 7],
    [5, 3, 3, 9],
    [6, 3, 3, 10],
    [7, 4, 3, 11],
    [8, 4, 3, 12],
  ])('level %i', (level, maxSpell, cantrips, prepared) => {
    const row = defaultRuleRegistry.classes.druid.progression.find(
      (x) => x.level === level,
    )!;
    expect(Math.max(0, ...Object.keys(row.spellSlots).map(Number))).toBe(
      maxSpell,
    );
    expect(row.cantripsKnown).toBe(cantrips);
    expect(row.preparedSpells).toBe(prepared);
    expect(row.resourceMaximums['wild-shape'] ?? 0).toBe(
      level < 2 ? 0 : level < 6 ? 2 : 3,
    );
  });
  test('does not expose future features', () => {
    const rows = defaultRuleRegistry.classes.druid.progression;
    expect(rows.find((r) => r.level === 4)?.featureIds).not.toContain(
      'druid-wild-resurgence',
    );
    expect(rows.find((r) => r.level === 5)?.featureIds).toContain(
      'druid-wild-resurgence',
    );
  });
});
describe('rule-integrated reference', () => {
  test('resolves generic and slice outputs', () => {
    const c = computeCharacter(
      referenceBuild,
      referenceSession,
      defaultRuleRegistry,
    );
    expect(c.maximumHp.value).toBe(83);
    expect(c.spellcasting?.spellSaveDc.value).toBe(16);
    expect(c.classLevel).toEqual({
      level: 8,
      cantripsKnown: 3,
      preparedSpells: 12,
      maximumSpellLevel: 4,
    });
    expect(c.activeResources.find((r) => r.id === 'wild-shape')).toMatchObject({
      maximum: 3,
      remaining: 0,
    });
    expect(c.activeFeatures.map((f) => f.id)).toContain('tough-durability');
    expect(
      c.spells.filter((s) => s.sourceTypes.includes('subclass')),
    ).toHaveLength(5);
    expect(
      c.spells.filter((s) => s.sourceTypes.includes('species')),
    ).toHaveLength(3);
    expect(c.spellDiagnostics).toEqual([]);
  });
  test('reports unknown IDs rather than crashing', () => {
    const c = computeCharacter(
      { ...referenceBuild, backgroundId: 'missing' },
      referenceSession,
      defaultRuleRegistry,
    );
    expect(c.ruleDiagnostics).toContainEqual({
      type: 'unknown-rule-id',
      category: 'background',
      id: 'missing',
    });
  });
});
describe('spell grants and preparation', () => {
  test.each(['arid', 'polar', 'temperate', 'tropical'])(
    '%s has gated Circle spells',
    (land) => {
      const at3 = activeSpellGrants(defaultRuleRegistry, 3, land).filter(
        (g) => g.sourceType === 'subclass',
      );
      const at7 = activeSpellGrants(defaultRuleRegistry, 7, land).filter(
        (g) => g.sourceType === 'subclass',
      );
      expect(at3).toHaveLength(3);
      expect(at7).toHaveLength(5);
      expect(
        at7.every((g) => g.alwaysPrepared && !g.countsAgainstPreparedLimit),
      ).toBe(true);
    },
  );
  test('returns explicit diagnostics', () => {
    const grants = activeSpellGrants(defaultRuleRegistry, 3, 'arid').filter(
      (g) => g.sourceType === 'subclass',
    );
    const result = validatePreparedSpells({
      preparedSpellIds: [
        'druidcraft',
        'fireball',
        'fire-bolt',
        'missing',
        'cure-wounds',
        'cure-wounds',
      ],
      classId: 'druid',
      maximum: 1,
      maximumSpellLevel: 2,
      grants,
      registry: defaultRuleRegistry,
    });
    expect(result.diagnostics.map((d) => d.type)).toEqual(
      expect.arrayContaining([
        'cantrip-in-prepared-spells',
        'inaccessible-spell-level',
        'granted-spell-counted-as-class',
        'missing-spell-definition',
        'duplicate-spell-selection',
        'too-many-prepared-spells',
      ]),
    );
  });
});
describe('resources and immutable rests', () => {
  test('spends without mutation and rejects overspending', () => {
    const state = { 'wild-shape': 2 };
    expect(spendResource(state, 'wild-shape', 1)).toEqual({ 'wild-shape': 1 });
    expect(state['wild-shape']).toBe(2);
    expect(() => spendResource(state, 'wild-shape', 3)).toThrow();
  });
  const input = {
    session: referenceSession,
    registry: defaultRuleRegistry,
    classLevel: 8,
    maximumHp: 83,
    spellSlotMaximums: { 1: 4, 2: 3, 3: 3, 4: 2 },
    activeOwnerIds: [
      'druid',
      'circle-of-the-land',
      'tiefling',
      'chthonic',
      'tough',
    ],
  };
  test('Short Rest restores one Wild Shape but not slots', () => {
    const preview = previewShortRest(input);
    const result = performShortRest(input);
    expect(preview.changes).toContainEqual(
      expect.objectContaining({ sourceId: 'wild-shape', before: 0, after: 1 }),
    );
    expect(result.success && result.session.spentSpellSlots).toEqual(
      referenceSession.spentSpellSlots,
    );
    expect(referenceSession.resources['wild-shape']).toBe(0);
  });
  test('Long Rest atomically restores and changes land', () => {
    const result = performLongRest({ ...input, selectedLandType: 'polar' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.currentHp).toBe(83);
      expect(result.session.spentSpellSlots[4]).toBe(0);
      expect(result.session.resources['wild-shape']).toBe(3);
      expect(result.session.resources['chthonic-false-life-use']).toBe(1);
      expect(result.session.selections?.circleOfTheLand?.landType).toBe(
        'polar',
      );
    }
    expect(referenceSession.currentHp).toBe(46);
  });
  test('rejects invalid land without changing session', () => {
    const result = performLongRest({ ...input, selectedLandType: 'bog' });
    expect(result).toMatchObject({ success: false, session: referenceSession });
  });
});
