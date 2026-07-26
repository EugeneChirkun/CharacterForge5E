import {
  equipmentRegistry,
  selectEquipment,
  type CharacterInventory,
  type CurrencyDenomination,
  type InventoryDiagnostic,
  type InventoryItem,
} from '../../domain/equipment';
export type InventoryChange = {
  readonly type:
    | 'added'
    | 'removed'
    | 'updated'
    | 'equipped'
    | 'unequipped'
    | 'moved'
    | 'attuned'
    | 'currency';
  readonly instanceId?: string;
};
export type InventoryCommandResult =
  | {
      readonly success: true;
      readonly inventory: CharacterInventory;
      readonly changes: readonly InventoryChange[];
      readonly diagnostics?: readonly InventoryDiagnostic[];
    }
  | {
      readonly success: false;
      readonly inventory: CharacterInventory;
      readonly diagnostics: readonly InventoryDiagnostic[];
    };
const fail = (
  inventory: CharacterInventory,
  type: InventoryDiagnostic['type'],
  message: string,
): InventoryCommandResult => ({
  success: false,
  inventory,
  diagnostics: [{ type, message, severity: 'error' }],
});
const update = (
  inventory: CharacterInventory,
  instanceId: string,
  fn: (item: InventoryItem) => InventoryItem,
  type: InventoryChange['type'] = 'updated',
): InventoryCommandResult =>
  inventory.items.some((i) => i.instanceId === instanceId)
    ? {
        success: true,
        inventory: {
          ...inventory,
          items: inventory.items.map((i) =>
            i.instanceId === instanceId ? fn(i) : i,
          ),
        },
        changes: [{ type, instanceId }],
      }
    : fail(inventory, 'item-not-owned', 'Item is not owned.');
export function addInventoryItem(
  inventory: CharacterInventory,
  input: {
    readonly instanceId: string;
    readonly definitionId: string;
    readonly quantity: number;
    readonly carried: boolean;
    readonly containerInstanceId?: string;
  },
): InventoryCommandResult {
  const d = equipmentRegistry[input.definitionId];
  if (!d)
    return fail(
      inventory,
      'unknown-item-definition',
      'Unknown equipment definition.',
    );
  if (!Number.isInteger(input.quantity) || input.quantity <= 0)
    return fail(
      inventory,
      'invalid-quantity',
      'Quantity must be a positive integer.',
    );
  if (!d.stackable && input.quantity > 1)
    return fail(
      inventory,
      'non-stackable-quantity',
      'This item is not stackable.',
    );
  if (inventory.items.some((i) => i.instanceId === input.instanceId))
    return fail(
      inventory,
      'corrupt-inventory-state',
      'Instance ID must be unique.',
    );
  if (
    input.containerInstanceId &&
    equipmentRegistry[
      inventory.items.find((i) => i.instanceId === input.containerInstanceId)
        ?.definitionId ?? ''
    ]?.category !== 'container'
  )
    return fail(inventory, 'invalid-container', 'Container does not exist.');
  return {
    success: true,
    inventory: {
      ...inventory,
      items: [
        ...inventory.items,
        { ...input, equipped: false, attuned: false },
      ],
    },
    changes: [{ type: 'added', instanceId: input.instanceId }],
  };
}
export function setInventoryQuantity(
  inventory: CharacterInventory,
  instanceId: string,
  quantity: number,
): InventoryCommandResult {
  const item = inventory.items.find((i) => i.instanceId === instanceId);
  if (!item) return fail(inventory, 'item-not-owned', 'Item is not owned.');
  if (!Number.isInteger(quantity) || quantity <= 0)
    return fail(
      inventory,
      'invalid-quantity',
      'Quantity must be a positive integer.',
    );
  if (!equipmentRegistry[item.definitionId]?.stackable && quantity > 1)
    return fail(
      inventory,
      'non-stackable-quantity',
      'This item is not stackable.',
    );
  return update(inventory, instanceId, (i) => ({ ...i, quantity }));
}
export function equipInventoryItem(
  inventory: CharacterInventory,
  instanceId: string,
  replace = false,
): InventoryCommandResult {
  const item = inventory.items.find((i) => i.instanceId === instanceId);
  if (!item) return fail(inventory, 'item-not-owned', 'Item is not owned.');
  if (!item.carried)
    return fail(
      inventory,
      'item-not-carried',
      'Only carried items may be equipped.',
    );
  if (item.equipped)
    return fail(
      inventory,
      'item-already-equipped',
      'Item is already equipped.',
    );
  const d = equipmentRegistry[item.definitionId];
  if (
    !d ||
    !['armor', 'shield', 'weapon', 'spellcasting-focus', 'tool'].includes(
      d.category,
    )
  )
    return fail(
      inventory,
      'incompatible-equipment',
      'This item cannot be equipped.',
    );
  const conflict = inventory.items.find(
    (i) =>
      i.equipped &&
      equipmentRegistry[i.definitionId]?.category === d.category &&
      ['armor', 'shield'].includes(d.category),
  );
  if (conflict && !replace)
    return fail(
      inventory,
      d.category === 'armor'
        ? 'armor-already-equipped'
        : 'shield-already-equipped',
      `Another ${d.category} is equipped.`,
    );
  const items = inventory.items.map((i) =>
    i.instanceId === instanceId
      ? { ...i, equipped: true }
      : conflict?.instanceId === i.instanceId
        ? { ...i, equipped: false }
        : i,
  );
  return {
    success: true,
    inventory: { ...inventory, items },
    changes: [
      ...(conflict
        ? [{ type: 'unequipped' as const, instanceId: conflict.instanceId }]
        : []),
      { type: 'equipped', instanceId },
    ],
  };
}
export const unequipInventoryItem = (
  inventory: CharacterInventory,
  instanceId: string,
) =>
  update(
    inventory,
    instanceId,
    (i) => ({ ...i, equipped: false }),
    'unequipped',
  );
export function setInventoryItemCarried(
  inventory: CharacterInventory,
  instanceId: string,
  carried: boolean,
): InventoryCommandResult {
  const item = inventory.items.find((i) => i.instanceId === instanceId);
  if (item?.equipped && !carried)
    return fail(
      inventory,
      'incompatible-equipment',
      'Unequip the item before storing it.',
    );
  return update(inventory, instanceId, (i) => ({
    ...i,
    carried,
    ...(carried ? {} : { containerInstanceId: undefined }),
  }));
}
export function moveInventoryItemToContainer(
  inventory: CharacterInventory,
  instanceId: string,
  containerInstanceId?: string,
): InventoryCommandResult {
  const item = inventory.items.find((i) => i.instanceId === instanceId);
  const container = inventory.items.find(
    (i) => i.instanceId === containerInstanceId,
  );
  if (!item) return fail(inventory, 'item-not-owned', 'Item is not owned.');
  if (
    containerInstanceId &&
    (!container ||
      equipmentRegistry[container.definitionId]?.category !== 'container')
  )
    return fail(inventory, 'invalid-container', 'Container does not exist.');
  if (instanceId === containerInstanceId)
    return fail(
      inventory,
      'circular-container-reference',
      'A container cannot contain itself.',
    );
  let cursor = container;
  while (cursor?.containerInstanceId) {
    if (cursor.containerInstanceId === instanceId)
      return fail(
        inventory,
        'circular-container-reference',
        'Circular containment is not allowed.',
      );
    cursor = inventory.items.find(
      (i) => i.instanceId === cursor?.containerInstanceId,
    );
  }
  return update(
    inventory,
    instanceId,
    (i) => ({ ...i, containerInstanceId }),
    'moved',
  );
}
export function removeInventoryItem(
  inventory: CharacterInventory,
  instanceId: string,
  options: {
    readonly unequip?: boolean;
    readonly endAttunement?: boolean;
    readonly moveContentsToRoot?: boolean;
  } = {},
): InventoryCommandResult {
  const item = inventory.items.find((i) => i.instanceId === instanceId);
  if (!item) return fail(inventory, 'item-not-owned', 'Item is not owned.');
  if (item.equipped && !options.unequip)
    return fail(
      inventory,
      'incompatible-equipment',
      'Unequip the item before removing it.',
    );
  if (item.attuned && !options.endAttunement)
    return fail(
      inventory,
      'duplicate-attunement',
      'End attunement before removing it.',
    );
  const contents = inventory.items.filter(
    (i) => i.containerInstanceId === instanceId,
  );
  if (contents.length && !options.moveContentsToRoot)
    return fail(
      inventory,
      'non-empty-container',
      'Move container contents before removing it.',
    );
  return {
    success: true,
    inventory: {
      ...inventory,
      items: inventory.items
        .filter((i) => i.instanceId !== instanceId)
        .map((i) =>
          i.containerInstanceId === instanceId
            ? { ...i, containerInstanceId: undefined }
            : i,
        ),
    },
    changes: [{ type: 'removed', instanceId }],
  };
}
export function attuneInventoryItem(
  inventory: CharacterInventory,
  instanceId: string,
): InventoryCommandResult {
  const item = inventory.items.find((i) => i.instanceId === instanceId);
  if (!item) return fail(inventory, 'item-not-owned', 'Item is not owned.');
  if (item.attuned)
    return fail(inventory, 'duplicate-attunement', 'Item is already attuned.');
  if (!equipmentRegistry[item.definitionId]?.attunement)
    return fail(
      inventory,
      'item-does-not-support-attunement',
      'Item does not support attunement.',
    );
  if (
    inventory.items.filter((i) => i.attuned).length >= inventory.attunementLimit
  )
    return fail(
      inventory,
      'attunement-limit-reached',
      'Attunement limit reached.',
    );
  return update(
    inventory,
    instanceId,
    (i) => ({ ...i, attuned: true }),
    'attuned',
  );
}
export const endAttunement = (
  inventory: CharacterInventory,
  instanceId: string,
) =>
  update(inventory, instanceId, (i) => ({ ...i, attuned: false }), 'attuned');
export const updateInventoryItemNotes = (
  inventory: CharacterInventory,
  instanceId: string,
  notes: string,
) =>
  update(inventory, instanceId, (i) => ({
    ...i,
    notes: notes.trim() || undefined,
  }));
export function setCurrency(
  inventory: CharacterInventory,
  denomination: CurrencyDenomination,
  value: number,
): InventoryCommandResult {
  if (!Number.isInteger(value) || value < 0)
    return fail(
      inventory,
      'invalid-currency-value',
      'Currency must be a non-negative integer.',
    );
  return {
    success: true,
    inventory: {
      ...inventory,
      currency: { ...inventory.currency, [denomination]: value },
    },
    changes: [{ type: 'currency' }],
  };
}
export function addCurrency(
  inventory: CharacterInventory,
  denomination: CurrencyDenomination,
  amount: number,
): InventoryCommandResult {
  if (!Number.isInteger(amount) || amount < 0)
    return fail(
      inventory,
      'invalid-currency-value',
      'Currency amount must be a non-negative integer.',
    );
  return setCurrency(
    inventory,
    denomination,
    inventory.currency[denomination] + amount,
  );
}
export function removeCurrency(
  inventory: CharacterInventory,
  denomination: CurrencyDenomination,
  amount: number,
): InventoryCommandResult {
  if (!Number.isInteger(amount) || amount < 0)
    return fail(
      inventory,
      'invalid-currency-value',
      'Currency amount must be a non-negative integer.',
    );
  if (amount > inventory.currency[denomination])
    return fail(inventory, 'insufficient-currency', 'Insufficient currency.');
  return setCurrency(
    inventory,
    denomination,
    inventory.currency[denomination] - amount,
  );
}
export { selectEquipment };
