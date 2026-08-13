import { describe, expect, test } from 'vitest';
import {
  addStartingPurchaseItem,
  addWallets,
  clearStartingPurchaseCart,
  copperToWallet,
  equipmentProficiencyWarning,
  finalizeStartingEquipment,
  removeStartingPurchaseItem,
  resolveStartingChoices,
  setStartingPurchaseQuantity,
  startingEquipmentPackages,
  startingGoldAlternatives,
  subtractWallet,
  summarizeStartingPurchase,
  walletToCopper,
  equipmentRegistry,
  type StartingEquipmentSourceChoice,
} from '../domain/equipment';

const choices = (
  druid: 'package' | 'gold',
  farmer: 'package' | 'gold',
): readonly StartingEquipmentSourceChoice[] => [
  { sourceId: 'druid.class.starting-equipment', choiceType: druid },
  { sourceId: 'farmer.background.starting-equipment', choiceType: farmer },
];

describe('Iteration 3.5B package registry and currency', () => {
  test('contains unique, verified, fully resolvable Druid and Farmer packages', () => {
    expect(
      new Set(startingEquipmentPackages.map((entry) => entry.id)).size,
    ).toBe(2);
    for (const definition of startingEquipmentPackages) {
      expect(definition.ruleSource.verified).toBe(true);
      for (const grant of definition.grants)
        if (grant.type === 'item') {
          expect(equipmentRegistry[grant.equipmentDefinitionId]).toBeDefined();
          expect(Number.isInteger(grant.quantity) && grant.quantity > 0).toBe(
            true,
          );
        }
    }
    expect(
      startingGoldAlternatives.find(
        (entry) => entry.id === 'druid.class.starting-gold',
      )?.wallet,
    ).toEqual({ cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 });
    expect(
      startingGoldAlternatives.find(
        (entry) => entry.id === 'farmer.background.starting-gold',
      )?.wallet.gp,
    ).toBe(50);
  });

  test('uses exact immutable wallet arithmetic', () => {
    const first = { cp: 5, sp: 2, ep: 1, gp: 3, pp: 1 } as const;
    const copy = structuredClone(first);
    expect(walletToCopper(first)).toBe(1375);
    expect(copperToWallet(3650)).toEqual({
      cp: 0,
      sp: 5,
      ep: 0,
      gp: 36,
      pp: 0,
    });
    expect(addWallets(first, { cp: 5, sp: 8, ep: 0, gp: 0, pp: 0 })).toEqual({
      cp: 10,
      sp: 10,
      ep: 1,
      gp: 3,
      pp: 1,
    });
    expect(
      subtractWallet(
        { cp: 0, sp: 0, ep: 0, gp: 1, pp: 0 },
        { cp: 1, sp: 0, ep: 0, gp: 0, pp: 0 },
      ),
    ).toEqual({ cp: 9, sp: 9, ep: 0, gp: 0, pp: 0 });
    expect(first).toEqual(copy);
  });

  test.each([
    ['package', 'package', 3900, 11],
    ['package', 'gold', 5900, 6],
    ['gold', 'package', 8000, 5],
    ['gold', 'gold', 10000, 0],
  ] as const)(
    'combines independent %s/%s choices',
    (druid, farmer, copper, itemCount) => {
      const result = resolveStartingChoices(choices(druid, farmer));
      expect(walletToCopper(result.availableWallet)).toBe(copper);
      expect(result.grants).toHaveLength(itemCount);
    },
  );
});

describe('Iteration 3.5B cart, warnings, and materialization', () => {
  test('edits an immutable cart, validates quantity, and reports affordability', () => {
    const draft = {
      sourceWallet: { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 },
      items: [],
    } as const;
    const added = addStartingPurchaseItem(draft, 'leather-armor');
    expect(added.success).toBe(true);
    if (!added.success) return;
    expect(draft.items).toEqual([]);
    expect(walletToCopper(added.summary.remainingWallet)).toBe(4000);
    const invalid = setStartingPurchaseQuantity(
      added.draft,
      'leather-armor',
      2,
    );
    expect(invalid.success).toBe(false);
    const unaffordable = addStartingPurchaseItem(added.draft, 'scimitar');
    expect(unaffordable.success && unaffordable.summary.affordable).toBe(true);
    const removed = removeStartingPurchaseItem(added.draft, 'leather-armor');
    expect(
      removed.success && walletToCopper(removed.summary.remainingWallet),
    ).toBe(5000);
    expect(clearStartingPurchaseCart(added.draft).success).toBe(true);
  });

  test('blocks an over-budget finalization without clearing the cart', () => {
    const cart = [{ equipmentDefinitionId: 'scimitar', quantity: 1 }];
    const summary = summarizeStartingPurchase({
      sourceWallet: { cp: 0, sp: 0, ep: 0, gp: 9, pp: 0 },
      items: cart,
    });
    expect(summary.affordable).toBe(false);
    const result = finalizeStartingEquipment(choices('package', 'package'), [
      { equipmentDefinitionId: 'scimitar', quantity: 1 },
      { equipmentDefinitionId: 'leather-armor', quantity: 1 },
      { equipmentDefinitionId: 'shield', quantity: 1 },
    ]);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.diagnostics[0].code).toBe('insufficient-starting-funds');
  });

  test('materializes sources, package equip policy, purchases, and remainder', () => {
    const result = finalizeStartingEquipment(choices('package', 'gold'), [
      { equipmentDefinitionId: 'hide-armor', quantity: 1 },
    ]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(
      result.inventory.items.find(
        (item) => item.definitionId === 'leather-armor',
      )?.equipped,
    ).toBe(true);
    expect(
      result.inventory.items.find((item) => item.definitionId === 'hide-armor'),
    ).toMatchObject({
      equipped: false,
      carried: true,
      acquisitionSource: { type: 'starting-purchase' },
    });
    expect(walletToCopper(result.inventory.currency)).toBe(4900);
    expect(result.inventory.items.every((item) => item.acquisitionSource)).toBe(
      true,
    );
  });

  test('generically warns Magician but not Warden for scoped training', () => {
    const medium = equipmentRegistry['hide-armor'];
    const martial = equipmentRegistry.scimitar;
    const magician = { armor: ['Light armor'], weapons: ['Simple weapons'] };
    const warden = {
      armor: ['Light armor', 'Medium armor'],
      weapons: ['Simple weapons', 'Martial weapons'],
    };
    expect(equipmentProficiencyWarning(medium, magician)).toContain(
      'medium armor',
    );
    expect(equipmentProficiencyWarning(martial, magician)).toContain(
      'martial weapons',
    );
    expect(equipmentProficiencyWarning(medium, warden)).toBeUndefined();
    expect(equipmentProficiencyWarning(martial, warden)).toBeUndefined();
  });
});
