import { describe, expect, test } from 'vitest';
import { createSpellDetailView } from '../application/spells/spell-detail-view';
import {
  equipmentRegistry,
  getEquipmentCatalogItems,
  productionEquipmentCategories,
} from '../domain/equipment';
import {
  addWallets,
  copperToWallet,
  summarizeStartingPurchase,
} from '../domain/equipment/starting-equipment';
import { defaultRuleRegistry } from '../domain/rules';

describe('stabilized production spell content', () => {
  test('contains no known production placeholders and reports availability truthfully', () => {
    const forbidden =
      /Varies; see Details|Duration in Details|primary magical effect|uses its PHB 2024 rules|see Details|TBD|TODO spell|placeholder spell/i;
    for (const spell of Object.values(defaultRuleRegistry.spells)) {
      expect(JSON.stringify(spell), spell.id).not.toMatch(forbidden);
      expect(spell.source.sourceId, spell.id).toBeTruthy();
      expect(spell.summary ?? spell.description, spell.id).toBeTruthy();
    }
  });

  test('previously incomplete examples and Thorn Whip share rich mechanics', () => {
    for (const id of ['animal-friendship', 'shocking-grasp'] as const) {
      const view = createSpellDetailView(defaultRuleRegistry.spells[id]);
      expect(
        `${view.rangeLabel} ${view.durationLabel} ${view.description ?? ''}`,
      ).not.toMatch(/see Details|uses its PHB/i);
      expect(['summary', 'full']).toContain(view.completeness);
      expect(view.description ?? view.summary).toBeTruthy();
    }
    const thorn = createSpellDetailView(
      defaultRuleRegistry.spells['thorn-whip'],
      undefined,
      5,
    );
    expect(thorn).toMatchObject({
      rangeLabel: '30 feet',
      durationLabel: 'Instantaneous',
      attackOrSaveLabel: 'Melee spell Attack',
      damageSummary: '2d6 Piercing',
      sourceLabel: 'PHB 2024',
    });
  });
});

describe('equipment catalog stabilization', () => {
  const categories = [
    'armor',
    'shield',
    'weapon',
    'tool',
    'adventuring-gear',
    'container',
    'spellcasting-focus',
  ] as const;
  test.each(categories)(
    '%s has a deterministic production catalog',
    (category) => {
      const items = getEquipmentCatalogItems({
        registry: equipmentRegistry,
        category,
        search: '',
        verifiedOnly: true,
        purchasableOnly: true,
      });
      expect(items.length).toBeGreaterThan(0);
      expect(
        items.every(
          (item) =>
            item.category === category ||
            (category === 'spellcasting-focus' &&
              item.capabilities?.includes(category)),
        ),
      ).toBe(true);
      expect(productionEquipmentCategories(equipmentRegistry)).toContain(
        category,
      );
    },
  );

  test('spellcasting focus supports category and search together without mutation', () => {
    const before = Object.keys(equipmentRegistry);
    expect(
      getEquipmentCatalogItems({
        registry: equipmentRegistry,
        category: 'spellcasting-focus',
        search: 'staff',
        verifiedOnly: true,
        purchasableOnly: true,
      }).map((item) => item.id),
    ).toEqual(['quarterstaff']);
    expect(Object.keys(equipmentRegistry)).toEqual(before);
  });
});

describe('currency denomination stabilization', () => {
  const gp = (value: number) => ({ cp: 0, sp: 0, ep: 0, gp: value, pp: 0 });
  test('gold grants and totals never silently promote to platinum', () => {
    expect(addWallets(gp(50))).toEqual(gp(50));
    expect(addWallets(gp(50), gp(50))).toEqual(gp(100));
    expect(copperToWallet(5_000)).toEqual(gp(50));
    expect(
      summarizeStartingPurchase({ sourceWallet: gp(50), items: [] })
        .remainingWallet,
    ).toEqual(gp(50));
  });

  test('mixed wallets preserve denomination fields when combined', () => {
    expect(
      addWallets(
        { cp: 4, sp: 3, ep: 2, gp: 50, pp: 1 },
        { cp: 1, sp: 2, ep: 0, gp: 5, pp: 0 },
      ),
    ).toEqual({ cp: 5, sp: 5, ep: 2, gp: 55, pp: 1 });
  });
});
