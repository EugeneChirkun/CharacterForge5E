import { describe, expect, test } from 'vitest';
import { computeCharacter } from '../domain/character';
import { defaultRuleRegistry, validateDruidPrimalOrder } from '../domain/rules';
import { performLongRest, performShortRest, previewLongRest, previewShortRest } from '../domain/rest';
import { referenceBuild, referenceSession } from '../features/characters/referenceCharacter';

describe('Druid Primal Order', () => {
  test('registry has exactly the typed Magician and Warden definitions', () => {
    expect(Object.keys(defaultRuleRegistry.druidPrimalOrders)).toEqual(['magician', 'warden']);
    expect(defaultRuleRegistry.druidPrimalOrders.magician.choices).toEqual(['additional-cantrip', 'skill-bonus-target']);
    expect(defaultRuleRegistry.druidPrimalOrders.warden.grants).toEqual(['medium-armor', 'martial-weapons']);
    expect(defaultRuleRegistry.druidPrimalOrders.warden.source.verified).toBe(true);
  });
  test('Magician validates duplicates and contributes minimum +1', () => {
    expect(validateDruidPrimalOrder({ orderId: 'magician', magicianChoices: { additionalCantripId: 'guidance', skillBonusTarget: 'arcana' } }, ['guidance'], defaultRuleRegistry)).toContain('invalid-magician-cantrip');
    const build = { ...referenceBuild, abilityScores: { ...referenceBuild.abilityScores, wisdom: 8 }, cantripIds: ['druidcraft'], class: { ...referenceBuild.class!, primalOrder: { orderId: 'magician' as const, magicianChoices: { additionalCantripId: 'guidance', skillBonusTarget: 'arcana' as const } } } };
    const c = computeCharacter(build, referenceSession);
    expect(c.skills.arcana.steps.at(-1)).toMatchObject({ label: 'Magician Primal Order bonus', value: 1 });
    expect(c.spells.some((s) => s.spellId === 'guidance')).toBe(true);
  });
  test('Warden grants generic training', () => {
    const c = computeCharacter(referenceBuild, referenceSession);
    expect(c.proficiencies.armor).toContain('Medium armor');
    expect(c.proficiencies.weapons).toContain('Martial weapons');
  });
});

describe('Wild Shape recovery', () => {
  const input = { session: referenceSession, registry: defaultRuleRegistry, classLevel: 8, maximumHp: 80, spellSlotMaximums: {}, activeOwnerIds: ['druid'], selectedLandType: 'temperate' };
  test('progression levels 1 through 8 comes from the resource definition', () => {
    expect(defaultRuleRegistry.resources['wild-shape'].maximum).toMatchObject({ values: { 2: 2, 5: 2, 6: 3, 8: 3 } });
  });
  test('short rest restores exactly one and preview matches execution', () => {
    const preview = previewShortRest(input);
    const result = performShortRest(input);
    expect(preview.changes.find((x) => x.sourceId === 'wild-shape')).toMatchObject({ before: 0, after: 1 });
    expect(result.success && result.session.resources['wild-shape']).toBe(1);
    expect(result.success && result.preview).toEqual(preview);
    expect(referenceSession.resources['wild-shape']).toBe(0);
  });
  test('long rest restores all and preview matches execution', () => {
    const preview = previewLongRest(input);
    const result = performLongRest(input);
    expect(preview.changes.find((x) => x.sourceId === 'wild-shape')).toMatchObject({ before: 0, after: 3 });
    expect(result.success && result.session.resources['wild-shape']).toBe(3);
  });
});
