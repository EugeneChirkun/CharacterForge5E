import { describe, expect, test } from 'vitest';
import {
  addCurrency,
  addInventoryItem,
  attuneInventoryItem,
  equipInventoryItem,
  moveInventoryItemToContainer,
  removeCurrency,
  removeInventoryItem,
  setInventoryQuantity,
  unequipInventoryItem,
} from '../application/inventory';
import { computeCharacter } from '../domain/character';
import {
  emptyInventory,
  equipmentDefinitions,
  selectEquipment,
  startingInventory,
} from '../domain/equipment';
import {
  referenceBuild,
  referenceSession,
} from '../features/characters/referenceCharacter';
import { migrateRecords } from '../infrastructure/persistence/local-character-repository';

describe('equipment registry', () => {
  test('has stable unique verified definitions and required categories', () => {
    expect(new Set(equipmentDefinitions.map((d) => d.id)).size).toBe(
      equipmentDefinitions.length,
    );
    expect(equipmentDefinitions.every((d) => d.source.verified)).toBe(true);
    expect(new Set(equipmentDefinitions.map((d) => d.category)).size).toBe(7);
  });

  test('starting equipment resolves and computes weight without mutation', () => {
    const inventory = startingInventory();
    const before = structuredClone(inventory.items);
    const selected = selectEquipment(inventory);
    expect(selected.equippedArmor?.name).toBe('Hide Armor');
    expect(selected.equippedShield?.name).toBe('Shield');
    expect(selected.ownedWeight).toBe(67);
    expect(inventory.items).toEqual(before);
  });
});

describe('immutable inventory commands', () => {
  test('adds stackable items, validates quantities, and updates immutably', () => {
    const original = emptyInventory();
    const added = addInventoryItem(original, {
      instanceId: 'food',
      definitionId: 'rations',
      quantity: 2,
      carried: true,
    });
    expect(added.success).toBe(true);
    if (!added.success) return;
    expect(original.items).toHaveLength(0);
    expect(setInventoryQuantity(added.inventory, 'food', 0).success).toBe(
      false,
    );
    const updated = setInventoryQuantity(added.inventory, 'food', 4);
    expect(updated.success && updated.inventory.items[0].quantity).toBe(4);
  });

  test('equips, replaces armor, rejects a second shield, and safely removes', () => {
    const initial = startingInventory();
    const leather = addInventoryItem(initial, {
      instanceId: 'leather',
      definitionId: 'leather-armor',
      quantity: 1,
      carried: true,
    });
    expect(leather.success).toBe(true);
    if (!leather.success) return;
    expect(equipInventoryItem(leather.inventory, 'leather').success).toBe(
      false,
    );
    const replaced = equipInventoryItem(leather.inventory, 'leather', true);
    expect(replaced.success).toBe(true);
    if (!replaced.success) return;
    expect(selectEquipment(replaced.inventory).equippedArmor?.id).toBe(
      'leather-armor',
    );
    expect(
      equipInventoryItem(replaced.inventory, 'starting-shield').success,
    ).toBe(false);
    expect(removeInventoryItem(replaced.inventory, 'leather').success).toBe(
      false,
    );
    expect(
      removeInventoryItem(replaced.inventory, 'leather', { unequip: true })
        .success,
    ).toBe(true);
  });

  test('prevents invalid and circular containment and protects contents', () => {
    let inventory = startingInventory();
    const second = addInventoryItem(inventory, {
      instanceId: 'bag-two',
      definitionId: 'backpack',
      quantity: 1,
      carried: true,
    });
    expect(second.success).toBe(true);
    if (!second.success) return;
    inventory = second.inventory;
    const moved = moveInventoryItemToContainer(
      inventory,
      'bag-two',
      'starting-pack',
    );
    expect(moved.success).toBe(true);
    if (!moved.success) return;
    expect(
      moveInventoryItemToContainer(moved.inventory, 'starting-pack', 'bag-two')
        .success,
    ).toBe(false);
    expect(removeInventoryItem(moved.inventory, 'starting-pack').success).toBe(
      false,
    );
    expect(
      removeInventoryItem(moved.inventory, 'starting-pack', {
        moveContentsToRoot: true,
      }).success,
    ).toBe(true);
  });

  test('keeps denominations independent and validates balances', () => {
    const added = addCurrency(emptyInventory(), 'gp', 10);
    expect(added.success).toBe(true);
    if (!added.success) return;
    expect(added.inventory.currency.sp).toBe(0);
    expect(removeCurrency(added.inventory, 'gp', 11).success).toBe(false);
    expect(removeCurrency(added.inventory, 'gp', 4)).toMatchObject({
      success: true,
      inventory: { currency: { gp: 6 } },
    });
  });

  test('rejects attunement for mundane supported equipment', () => {
    expect(
      attuneInventoryItem(startingInventory(), 'starting-focus'),
    ).toMatchObject({
      success: false,
      diagnostics: [{ type: 'item-does-not-support-attunement' }],
    });
  });
});

describe('character integration and migration', () => {
  test('equipment supplies AC exactly once and unequipping changes it', () => {
    const computed = computeCharacter(referenceBuild, referenceSession);
    expect(computed.armorClass.value).toBe(16);
    const noShield = unequipInventoryItem(
      referenceSession.inventory!,
      'starting-shield',
    );
    expect(noShield.success).toBe(true);
    if (!noShield.success) return;
    expect(
      computeCharacter(referenceBuild, {
        ...referenceSession,
        inventory: noShield.inventory,
      }).armorClass.value,
    ).toBe(14);
  });

  test('migrates a schema-v1 record and does not persist derived values', () => {
    const migrated = migrateRecords([
      {
        schemaVersion: 1,
        build: { ...referenceBuild, id: 'old-character' },
        session: { ...referenceSession, inventory: undefined },
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    expect(migrated[0].schemaVersion).toBe(2);
    expect(migrated[0].session.inventory?.items.length).toBeGreaterThan(0);
    expect(migrated[0].session.inventory).not.toHaveProperty('ownedWeight');
    expect(migrated[0].session.inventory).not.toHaveProperty('armorClass');
  });
});
