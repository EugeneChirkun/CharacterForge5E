import { describe, expect, test } from 'vitest';
import { defaultRuleRegistry } from '../domain/rules';
import { createSpellDetailView } from '../application/spells/spell-detail-view';
import { auditSpellContent } from '../domain/spells';
import {
  createPreparationDraft,
  togglePreparationDraft,
  validatePreparationDraft,
} from '../application/spells/spell-preparation-draft';

describe('Iteration 4.0 rich spell content', () => {
  test('definitions have stable unique IDs and content metadata', () => {
    const spells = Object.values(defaultRuleRegistry.spells);
    expect(new Set(spells.map((spell) => spell.id)).size).toBe(spells.length);
    for (const spell of spells) {
      expect(defaultRuleRegistry.spells[spell.id]).toBe(spell);
      expect(spell.level).toBeGreaterThanOrEqual(0);
      expect(spell.level).toBeLessThanOrEqual(5);
      if (spell.content.completeness === 'full')
        expect(spell.description?.length).toBeGreaterThan(0);
      expect(['none', 'summary', 'full']).toContain(spell.content.completeness);
      expect(spell.source.verified).toBe(true);
    }
  });

  test('shared detail view formats structured rich mechanics and tolerates absent optionals', () => {
    const thornWhip = createSpellDetailView(
      defaultRuleRegistry.spells['thorn-whip'],
    );
    expect(thornWhip).toMatchObject({
      name: 'Thorn Whip',
      levelLabel: 'Cantrip',
      schoolLabel: 'Transmutation',
      rangeLabel: '30 feet',
      attackOrSaveLabel: 'Melee spell Attack',
      damageSummary: '1d6 Piercing',
      completeness: 'full',
    });
    expect(thornWhip.scalingSummary).toContain('Level 17: 4d6');
    expect(
      createSpellDetailView(defaultRuleRegistry.spells.awaken).damageSummary,
    ).toBeUndefined();
  });

  test('audits the complete supported Druid, Circle, Chthonic, and Magician scope', () => {
    const relevantIds = new Set([
      ...Object.values(defaultRuleRegistry.spells)
        .filter((spell) => spell.classIds.includes('druid') && spell.level <= 5)
        .map((spell) => spell.id),
      ...Object.values(defaultRuleRegistry.spellGrants)
        .filter((grant) => grant.unlockedAtCharacterLevel <= 9)
        .map((grant) => grant.spellId),
    ]);
    const relevant = [...relevantIds].map(
      (id) => defaultRuleRegistry.spells[id],
    );
    expect(relevant.length).toBeGreaterThan(50);
    const audits = relevant.map(auditSpellContent);
    expect(audits.every((audit) => audit.spellId.length > 0)).toBe(true);
    expect(audits.some((audit) => audit.completeness === 'none')).toBe(true);
  });

  test('Guidance and Druidcraft expose authored 2024 effects without fallback prose', () => {
    const guidance = createSpellDetailView(defaultRuleRegistry.spells.guidance);
    expect(guidance).toMatchObject({
      rangeLabel: 'Touch',
      concentration: true,
      completeness: 'full',
    });
    expect(guidance.effectLabels).toContain(
      'Add 1d4 to one failed ability check',
    );
    const druidcraft = createSpellDetailView(
      defaultRuleRegistry.spells.druidcraft,
    );
    expect(druidcraft.effectLabels).toContain(
      'Predict the weather for the next 24 hours',
    );
    expect(`${guidance.description} ${druidcraft.description}`).not.toMatch(
      /imported rules|not yet bundled/i,
    );
  });

  test('compact mechanics are structured and cantrip damage uses current character level', () => {
    const thornWhip = createSpellDetailView(
      defaultRuleRegistry.spells['thorn-whip'],
      undefined,
      5,
    );
    expect(thornWhip.damageSummary).toBe('2d6 Piercing');
    expect(thornWhip.effectLabels[0]).toMatch(/pull/i);
    const entangle = createSpellDetailView(defaultRuleRegistry.spells.entangle);
    expect(entangle).toMatchObject({
      attackOrSaveLabel: 'STRENGTH Save',
      areaLabel: '20-ft square',
    });
    expect(
      createSpellDetailView(defaultRuleRegistry.spells['cure-wounds'])
        .healingSummary,
    ).toBe('2d8 + spellcasting ability');
  });
});

describe('prospective level-up preparation draft', () => {
  const firstTwelve = Object.values(defaultRuleRegistry.spells)
    .filter(
      (spell) =>
        spell.classIds.includes('druid') && spell.level > 0 && spell.level <= 4,
    )
    .slice(0, 12)
    .map((spell) => spell.id);

  test('8 to 9 preserves twelve, permits under-filling, and exposes level 5 choices', () => {
    let draft = createPreparationDraft(firstTwelve);
    expect(draft.preparedDruidSpellIds).toHaveLength(12);
    expect(validatePreparationDraft(draft, 9, defaultRuleRegistry)).toEqual([]);
    const added = togglePreparationDraft(
      draft,
      'awaken',
      9,
      defaultRuleRegistry,
    );
    expect(added.diagnostics).toEqual([]);
    draft = added.draft;
    expect(draft.preparedDruidSpellIds).toContain('awaken');
    const replaced = togglePreparationDraft(
      draft,
      firstTwelve[0],
      9,
      defaultRuleRegistry,
    );
    expect(replaced.draft.preparedDruidSpellIds).not.toContain(firstTwelve[0]);
  });

  test('rejects a fifteenth ordinary preparation', () => {
    const fourteen = Object.values(defaultRuleRegistry.spells)
      .filter(
        (spell) =>
          spell.classIds.includes('druid') &&
          spell.level > 0 &&
          spell.level <= 5,
      )
      .slice(0, 14)
      .map((spell) => spell.id);
    const result = togglePreparationDraft(
      createPreparationDraft(fourteen),
      'tree-stride',
      9,
      defaultRuleRegistry,
    );
    expect(result.diagnostics[0]?.type).toBe('prepared-spell-limit-exceeded');
    expect(result.draft.preparedDruidSpellIds).toEqual(fourteen);
  });
});
