import { describe, expect, test } from 'vitest';
import { defaultRuleRegistry } from '../domain/rules';
import { createSpellDetailView } from '../application/spells/spell-detail-view';
import { createPreparationDraft, togglePreparationDraft, validatePreparationDraft } from '../application/spells/spell-preparation-draft';

describe('Iteration 4.0 rich spell content', () => {
  test('definitions have stable unique IDs and content metadata', () => {
    const spells = Object.values(defaultRuleRegistry.spells);
    expect(new Set(spells.map((spell) => spell.id)).size).toBe(spells.length);
    for (const spell of spells) {
      expect(defaultRuleRegistry.spells[spell.id]).toBe(spell);
      expect(spell.level).toBeGreaterThanOrEqual(0);
      expect(spell.level).toBeLessThanOrEqual(5);
      expect(spell.description.length).toBeGreaterThan(0);
      expect(['full', 'summary', 'mechanics-only']).toContain(spell.content.completeness);
      expect(spell.source.verified).toBe(true);
    }
  });

  test('shared detail view formats structured rich mechanics and tolerates absent optionals', () => {
    const thornWhip = createSpellDetailView(defaultRuleRegistry.spells['thorn-whip']);
    expect(thornWhip).toMatchObject({ name: 'Thorn Whip', levelLabel: 'Cantrip', schoolLabel: 'Transmutation', rangeLabel: '30 feet', attackOrSaveLabel: 'Melee spell Attack', damageSummary: '1d6 Piercing', completeness: 'summary' });
    expect(thornWhip.scalingSummary).toContain('Level 17: 4d6');
    expect(createSpellDetailView(defaultRuleRegistry.spells.awaken).damageSummary).toBeUndefined();
  });
});

describe('prospective level-up preparation draft', () => {
  const firstTwelve = Object.values(defaultRuleRegistry.spells).filter((spell) => spell.classIds.includes('druid') && spell.level > 0 && spell.level <= 4).slice(0, 12).map((spell) => spell.id);

  test('8 to 9 preserves twelve, permits under-filling, and exposes level 5 choices', () => {
    let draft = createPreparationDraft(firstTwelve);
    expect(draft.preparedDruidSpellIds).toHaveLength(12);
    expect(validatePreparationDraft(draft, 9, defaultRuleRegistry)).toEqual([]);
    const added = togglePreparationDraft(draft, 'awaken', 9, defaultRuleRegistry);
    expect(added.diagnostics).toEqual([]);
    draft = added.draft;
    expect(draft.preparedDruidSpellIds).toContain('awaken');
    const replaced = togglePreparationDraft(draft, firstTwelve[0], 9, defaultRuleRegistry);
    expect(replaced.draft.preparedDruidSpellIds).not.toContain(firstTwelve[0]);
  });

  test('rejects a fifteenth ordinary preparation', () => {
    const fourteen = Object.values(defaultRuleRegistry.spells).filter((spell) => spell.classIds.includes('druid') && spell.level > 0 && spell.level <= 5).slice(0, 14).map((spell) => spell.id);
    const result = togglePreparationDraft(createPreparationDraft(fourteen), 'tree-stride', 9, defaultRuleRegistry);
    expect(result.diagnostics[0]?.type).toBe('prepared-spell-limit-exceeded');
    expect(result.draft.preparedDruidSpellIds).toEqual(fourteen);
  });
});
