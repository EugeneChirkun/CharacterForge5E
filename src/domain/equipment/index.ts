import type { ArmorClassSource } from '../armor-class';

export type EquipmentCategory =
  | 'armor'
  | 'shield'
  | 'weapon'
  | 'tool'
  | 'adventuring-gear'
  | 'container'
  | 'spellcasting-focus';
export interface CurrencyWallet {
  readonly cp: number;
  readonly sp: number;
  readonly ep: number;
  readonly gp: number;
  readonly pp: number;
}
export type CurrencyDenomination = keyof CurrencyWallet;
export interface EquipmentSource {
  readonly ruleset: '5e-2024';
  readonly verified: boolean;
  readonly reference: string;
}
interface EquipmentBase {
  readonly id: string;
  readonly name: string;
  readonly category: EquipmentCategory;
  readonly weight?: number;
  /** Verified list price, normalized to copper pieces for exact arithmetic. */
  readonly priceCopper?: number;
  readonly stackable: boolean;
  readonly source: EquipmentSource;
  readonly attunement?: 'allowed' | 'required';
}
export interface ArmorDefinition extends EquipmentBase {
  readonly category: 'armor';
  readonly armorCategory: 'light' | 'medium' | 'heavy';
  readonly baseArmorClass: number;
  readonly dexterityModifier:
    | { readonly type: 'full' }
    | { readonly type: 'capped'; readonly maximum: number }
    | { readonly type: 'none' };
}
export interface ShieldDefinition extends EquipmentBase {
  readonly category: 'shield';
  readonly armorClassBonus: number;
}
export interface WeaponDefinition extends EquipmentBase {
  readonly category: 'weapon';
  readonly weaponCategory: 'simple' | 'martial';
  readonly weaponType: 'melee' | 'ranged';
  readonly damage?: {
    readonly diceCount: number;
    readonly dieSize: 4 | 6 | 8 | 10 | 12;
    readonly damageType: 'bludgeoning' | 'piercing' | 'slashing';
  };
  readonly properties: readonly string[];
  readonly range?: { readonly normal: number; readonly long?: number };
}
export interface ToolDefinition extends EquipmentBase {
  readonly category: 'tool';
  readonly toolType: string;
}
export interface GearDefinition extends EquipmentBase {
  readonly category: 'adventuring-gear';
}
export interface ContainerDefinition extends EquipmentBase {
  readonly category: 'container';
}
export interface FocusDefinition extends EquipmentBase {
  readonly category: 'spellcasting-focus';
  readonly focusTypes: readonly string[];
}
export type EquipmentDefinition =
  | ArmorDefinition
  | ShieldDefinition
  | WeaponDefinition
  | ToolDefinition
  | GearDefinition
  | ContainerDefinition
  | FocusDefinition;
const verified = (reference: string): EquipmentSource => ({
  ruleset: '5e-2024',
  verified: true,
  reference,
});
export const equipmentDefinitions = [
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    category: 'armor',
    armorCategory: 'light',
    baseArmorClass: 11,
    dexterityModifier: { type: 'full' },
    weight: 10,
    priceCopper: 1000,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'hide-armor',
    name: 'Hide Armor',
    category: 'armor',
    armorCategory: 'medium',
    baseArmorClass: 12,
    dexterityModifier: { type: 'capped', maximum: 2 },
    weight: 12,
    priceCopper: 1000,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'shield',
    name: 'Shield',
    category: 'shield',
    armorClassBonus: 2,
    weight: 6,
    priceCopper: 1000,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'sickle',
    name: 'Sickle',
    category: 'weapon',
    weaponCategory: 'simple',
    weaponType: 'melee',
    damage: { diceCount: 1, dieSize: 4, damageType: 'slashing' },
    properties: ['light'],
    weight: 2,
    priceCopper: 100,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'quarterstaff',
    name: 'Quarterstaff',
    category: 'weapon',
    weaponCategory: 'simple',
    weaponType: 'melee',
    damage: { diceCount: 1, dieSize: 6, damageType: 'bludgeoning' },
    properties: ['versatile'],
    weight: 4,
    priceCopper: 20,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'spear',
    name: 'Spear',
    category: 'weapon',
    weaponCategory: 'simple',
    weaponType: 'melee',
    damage: { diceCount: 1, dieSize: 6, damageType: 'piercing' },
    properties: ['thrown', 'versatile'],
    range: { normal: 20, long: 60 },
    weight: 3,
    priceCopper: 100,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'sling',
    name: 'Sling',
    category: 'weapon',
    weaponCategory: 'simple',
    weaponType: 'ranged',
    damage: { diceCount: 1, dieSize: 4, damageType: 'bludgeoning' },
    properties: ['ammunition'],
    range: { normal: 30, long: 120 },
    priceCopper: 10,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'druidic-focus',
    name: 'Druidic Focus',
    category: 'spellcasting-focus',
    focusTypes: ['druidic'],
    weight: 0,
    stackable: false,
    source: verified('Legacy structured-inventory compatibility'),
  },
  {
    id: 'druidic-focus-quarterstaff',
    name: 'Druidic Focus (Quarterstaff)',
    category: 'spellcasting-focus',
    focusTypes: ['druidic'],
    weight: 4,
    priceCopper: 500,
    stackable: false,
    source: verified('Free Rules 2024 class equipment'),
  },
  {
    id: 'herbalism-kit',
    name: 'Herbalism Kit',
    category: 'tool',
    toolType: 'herbalism kit',
    weight: 3,
    priceCopper: 500,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'backpack',
    name: 'Backpack',
    category: 'container',
    weight: 5,
    priceCopper: 200,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'bedroll',
    name: 'Bedroll',
    category: 'adventuring-gear',
    weight: 7,
    priceCopper: 100,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'rations',
    name: 'Rations',
    category: 'adventuring-gear',
    weight: 2,
    priceCopper: 50,
    stackable: true,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'rope-hempen',
    name: 'Rope, Hempen',
    category: 'adventuring-gear',
    weight: 10,
    priceCopper: 100,
    stackable: false,
    source: verified('Free Rules 2024 equipment table'),
  },
  {
    id: 'explorers-pack',
    name: "Explorer's Pack",
    category: 'container',
    weight: 59,
    priceCopper: 1000,
    stackable: false,
    source: verified('PHB 2024 / Adventuring Gear'),
  },
  {
    id: 'carpenters-tools',
    name: "Carpenter's Tools",
    category: 'tool',
    toolType: "carpenter's tools",
    weight: 6,
    priceCopper: 800,
    stackable: false,
    source: verified('PHB 2024 / Tools'),
  },
  {
    id: 'healers-kit',
    name: "Healer's Kit",
    category: 'adventuring-gear',
    weight: 3,
    priceCopper: 500,
    stackable: false,
    source: verified('PHB 2024 / Adventuring Gear'),
  },
  {
    id: 'iron-pot',
    name: 'Iron Pot',
    category: 'adventuring-gear',
    weight: 10,
    priceCopper: 200,
    stackable: false,
    source: verified('PHB 2024 / Adventuring Gear'),
  },
  {
    id: 'shovel',
    name: 'Shovel',
    category: 'adventuring-gear',
    weight: 5,
    priceCopper: 200,
    stackable: false,
    source: verified('PHB 2024 / Adventuring Gear'),
  },
  {
    id: 'travelers-clothes',
    name: "Traveler's Clothes",
    category: 'adventuring-gear',
    weight: 4,
    priceCopper: 200,
    stackable: false,
    source: verified('PHB 2024 / Adventuring Gear'),
  },
  {
    id: 'scimitar',
    name: 'Scimitar',
    category: 'weapon',
    weaponCategory: 'martial',
    weaponType: 'melee',
    damage: { diceCount: 1, dieSize: 6, damageType: 'slashing' },
    properties: ['finesse', 'light'],
    weight: 3,
    priceCopper: 2500,
    stackable: false,
    source: verified('PHB 2024 / Weapons'),
  },
] as const satisfies readonly EquipmentDefinition[];
export const equipmentRegistry: Readonly<Record<string, EquipmentDefinition>> =
  Object.freeze(Object.fromEntries(equipmentDefinitions.map((d) => [d.id, d])));

export interface InventoryItem {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly quantity: number;
  readonly equipped: boolean;
  readonly carried: boolean;
  readonly containerInstanceId?: string;
  readonly attuned: boolean;
  readonly notes?: string;
  readonly acquisitionSource?: InventoryAcquisitionSource;
}
export type InventoryAcquisitionSource =
  | { readonly type: 'starting-package'; readonly sourceId: string }
  | { readonly type: 'starting-purchase' }
  | { readonly type: 'manual' };
export interface CharacterInventory {
  readonly items: readonly InventoryItem[];
  readonly currency: CurrencyWallet;
  readonly attunementLimit: number;
}
export const emptyWallet = (): CurrencyWallet => ({
  cp: 0,
  sp: 0,
  ep: 0,
  gp: 0,
  pp: 0,
});
export const emptyInventory = (): CharacterInventory => ({
  items: [],
  currency: emptyWallet(),
  attunementLimit: 3,
});
export const startingInventory = (): CharacterInventory => ({
  items: (
    [
      ['armor', 'hide-armor', true],
      ['shield', 'shield', true],
      ['staff', 'quarterstaff', false],
      ['focus', 'druidic-focus', true],
      ['kit', 'herbalism-kit', false],
      ['pack', 'backpack', false],
      ['bedroll', 'bedroll', false],
      ['rations', 'rations', false],
      ['rope', 'rope-hempen', false],
    ] satisfies readonly (readonly [string, string, boolean])[]
  ).map(([instanceId, definitionId, equipped]) => ({
    instanceId: `starting-${instanceId}`,
    definitionId,
    quantity: definitionId === 'rations' ? 10 : 1,
    equipped,
    carried: true,
    attuned: false,
  })),
  currency: emptyWallet(),
  attunementLimit: 3,
});
export type InventoryDiagnosticType =
  | 'unknown-item-definition'
  | 'invalid-quantity'
  | 'non-stackable-quantity'
  | 'item-not-owned'
  | 'item-not-carried'
  | 'item-already-equipped'
  | 'incompatible-equipment'
  | 'armor-already-equipped'
  | 'shield-already-equipped'
  | 'missing-training'
  | 'invalid-container'
  | 'circular-container-reference'
  | 'non-empty-container'
  | 'invalid-currency-value'
  | 'insufficient-currency'
  | 'item-does-not-support-attunement'
  | 'attunement-limit-reached'
  | 'duplicate-attunement'
  | 'corrupt-inventory-state';
export interface InventoryDiagnostic {
  readonly type: InventoryDiagnosticType;
  readonly message: string;
  readonly severity: 'error' | 'warning';
  readonly instanceId?: string;
}
export interface EquipmentSummary {
  readonly equippedArmor?: EquipmentDefinition;
  readonly equippedShield?: EquipmentDefinition;
  readonly equippedWeapons: readonly EquipmentDefinition[];
  readonly equippedFocus?: EquipmentDefinition;
  readonly carriedWeight: number;
  readonly storedWeight: number;
  readonly ownedWeight: number;
  readonly diagnostics: readonly InventoryDiagnostic[];
  readonly armorClassSources: readonly ArmorClassSource[];
  readonly armorClassSteps: readonly string[];
}
export function validateInventory(
  inventory: CharacterInventory,
): readonly InventoryDiagnostic[] {
  const diagnostics: InventoryDiagnostic[] = [];
  const ids = new Set(inventory.items.map((i) => i.instanceId));
  for (const item of inventory.items) {
    const definition = equipmentRegistry[item.definitionId];
    if (!definition)
      diagnostics.push({
        type: 'unknown-item-definition',
        message: `Unknown equipment: ${item.definitionId}.`,
        severity: 'error',
        instanceId: item.instanceId,
      });
    if (!Number.isInteger(item.quantity) || item.quantity <= 0)
      diagnostics.push({
        type: 'invalid-quantity',
        message: 'Quantity must be a positive integer.',
        severity: 'error',
        instanceId: item.instanceId,
      });
    if (definition && !definition.stackable && item.quantity > 1)
      diagnostics.push({
        type: 'non-stackable-quantity',
        message: `${definition.name} cannot be stacked.`,
        severity: 'error',
        instanceId: item.instanceId,
      });
    if (item.containerInstanceId && !ids.has(item.containerInstanceId))
      diagnostics.push({
        type: 'invalid-container',
        message: 'The selected container does not exist.',
        severity: 'error',
        instanceId: item.instanceId,
      });
  }
  for (const denomination of Object.keys(
    inventory.currency,
  ) as CurrencyDenomination[])
    if (
      !Number.isInteger(inventory.currency[denomination]) ||
      inventory.currency[denomination] < 0
    )
      diagnostics.push({
        type: 'invalid-currency-value',
        message: `${denomination.toUpperCase()} must be a non-negative integer.`,
        severity: 'error',
      });
  return diagnostics;
}
export function selectEquipment(
  inventory: CharacterInventory,
): EquipmentSummary {
  const resolved = inventory.items
    .map((item) => ({ item, definition: equipmentRegistry[item.definitionId] }))
    .filter(
      (x): x is { item: InventoryItem; definition: EquipmentDefinition } =>
        !!x.definition,
    );
  const weight = (predicate: (i: InventoryItem) => boolean) =>
    resolved
      .filter(({ item }) => predicate(item))
      .reduce(
        (n, { item, definition }) =>
          n + (definition.weight ?? 0) * item.quantity,
        0,
      );
  const equipped = resolved.filter(({ item }) => item.equipped);
  const armor = equipped.find(
    ({ definition }) => definition.category === 'armor',
  )?.definition;
  const shield = equipped.find(
    ({ definition }) => definition.category === 'shield',
  )?.definition;
  const sources: ArmorClassSource[] = [];
  const steps: string[] = [];
  if (armor?.category === 'armor') {
    sources.push({
      type: 'armor',
      base: armor.baseArmorClass,
      ...(armor.dexterityModifier.type === 'full'
        ? {}
        : armor.dexterityModifier.type === 'capped'
          ? { dexterityCap: armor.dexterityModifier.maximum }
          : { dexterityCap: 0 }),
      label: armor.name,
    });
    steps.push(`${armor.name} base: ${armor.baseArmorClass}`);
  }
  if (shield?.category === 'shield') {
    sources.push({
      type: 'shield',
      amount: shield.armorClassBonus,
      label: shield.name,
    });
    steps.push(`${shield.name}: +${shield.armorClassBonus}`);
  }
  return {
    equippedArmor: armor,
    equippedShield: shield,
    equippedWeapons: equipped
      .filter(({ definition }) => definition.category === 'weapon')
      .map(({ definition }) => definition),
    equippedFocus: equipped.find(
      ({ definition }) => definition.category === 'spellcasting-focus',
    )?.definition,
    carriedWeight: weight((i) => i.carried),
    storedWeight: weight((i) => !i.carried),
    ownedWeight: weight(() => true),
    diagnostics: validateInventory(inventory),
    armorClassSources: sources,
    armorClassSteps: steps,
  };
}
export const sortInventoryItems = (items: readonly InventoryItem[]) =>
  [...items].sort(
    (a, b) =>
      Number(b.equipped) - Number(a.equipped) ||
      (equipmentRegistry[a.definitionId]?.category ?? '').localeCompare(
        equipmentRegistry[b.definitionId]?.category ?? '',
      ) ||
      (equipmentRegistry[a.definitionId]?.name ?? '').localeCompare(
        equipmentRegistry[b.definitionId]?.name ?? '',
      ) ||
      a.instanceId.localeCompare(b.instanceId),
  );

export type EquipmentDiagnostic = {
  readonly type: 'missing-equipment-choice' | 'invalid-equipment-choice';
};
export function validateEquipment(
  ids: readonly string[],
): readonly EquipmentDiagnostic[] {
  return ids.length !== 1
    ? [
        {
          type: ids.length
            ? 'invalid-equipment-choice'
            : 'missing-equipment-choice',
        },
      ]
    : ids[0] === 'druid-farmer-preset'
      ? []
      : [{ type: 'invalid-equipment-choice' }];
}

export * from './starting-equipment';
