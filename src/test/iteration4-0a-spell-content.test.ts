import { describe, expect, test } from 'vitest';
import { createSpellDetailView } from '../application/spells/spell-detail-view';
import { defaultRuleRegistry } from '../domain/rules';
import { auditSpellContent, averageDiceExpression, formatDiceExpression, parsePrivateSpellContentPack, resolveSpellContent } from '../domain/spells';

const forbidden = /Not available in installed content|Varies; see Details|Duration in Details|primary magical effect|uses its PHB 2024 rules|Description not available in installed content/i;

describe('Iteration 4.0A complete spell content', () => {
  test('every reachable registry spell has critical structured content', () => {
    const spells = Object.values(defaultRuleRegistry.spells);
    expect(new Set(spells.map((spell) => spell.id)).size).toBe(spells.length);
    expect(spells).toHaveLength(61);
    for (const spell of spells) {
      expect(spell.level).toBeGreaterThanOrEqual(0);
      expect(spell.level).toBeLessThanOrEqual(5);
      expect(spell.castingTime).toBeTruthy();
      expect(spell.range).toBeTruthy();
      expect(spell.duration).toBeTruthy();
      expect(spell.components).toBeTruthy();
      expect(spell.summary ?? spell.description).toBeTruthy();
      expect(JSON.stringify(spell)).not.toMatch(forbidden);
      expect(auditSpellContent(spell).missingFields).toEqual([]);
    }
  });

  test('Healing Word exposes structured healing, slot scaling, and useful labels', () => {
    const spell = defaultRuleRegistry.spells['healing-word'];
    expect(spell.castingTime).toEqual({ type: 'bonus-action' });
    expect(spell.range).toEqual({ type: 'distance', feet: 60 });
    expect(spell.duration).toEqual({ type: 'instantaneous' });
    expect(spell.components).toEqual({ verbal: true, somatic: false, material: false });
    expect(spell.healing?.[0].dice).toMatchObject({ count: 2, die: 4, modifierType: 'spellcasting-ability' });
    expect(spell.scaling?.type).toBe('slot-level');
    const view = createSpellDetailView(spell);
    expect(view.castingTimeLabel).toBe('Bonus Action');
    expect(view.rangeLabel).toBe('60 feet');
    expect(view.sources[0].label).toBe('Druid');
    expect(JSON.stringify(view)).not.toMatch(forbidden);
  });

  test('Thorn Whip derives current dice and keeps its attack and pull mechanics', () => {
    const spell = defaultRuleRegistry.spells['thorn-whip'];
    expect(createSpellDetailView(spell, undefined, 5).damageSummary).toBe('2d6 Piercing');
    expect(spell.attackType).toBe('melee-spell');
    expect(spell.effects?.some((effect) => effect.shortText.includes('10 feet'))).toBe(true);
    expect(spell.components.materialRequirement).toBeTruthy();
  });

  test('dice formatting and static averages are centralized', () => {
    expect(formatDiceExpression({ count: 2, die: 6, modifier: 4 })).toBe('2d6 + 4');
    expect(averageDiceExpression({ count: 2, die: 6, modifier: 4 })).toBe(11);
  });

  test('private prose overrides safely while public mechanics remain authoritative', () => {
    const pack = parsePrivateSpellContentPack({ format: 'characterforge5e-spell-content', version: 1, source: { id: 'local-phb', label: 'PHB 2024 — Private content' }, spells: { 'healing-word': { description: 'Locally supplied plain text.' } } });
    const resolved = resolveSpellContent({ spellId: 'healing-word', publicContentRegistry: defaultRuleRegistry.spells, privateContentRegistry: pack });
    expect(resolved.proseSource).toBe('private-phb');
    expect(resolved.definition.description).toBe('Locally supplied plain text.');
    expect(resolved.definition.healing).toBe(defaultRuleRegistry.spells['healing-word'].healing);
    expect(() => parsePrivateSpellContentPack({ version: 9 })).toThrow();
  });
});
