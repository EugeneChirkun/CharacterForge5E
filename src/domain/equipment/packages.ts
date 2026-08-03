import {
  equipmentRegistry,
  type EquipmentDefinition,
  type InventoryItem,
} from './index';

export interface EquipmentPackageEntry {
  readonly definitionId: string;
  readonly quantity: number;
}
export interface EquipmentPackageDefinition {
  readonly id: string;
  readonly name: string;
  readonly priceCopper: number;
  readonly contents: readonly EquipmentPackageEntry[];
  readonly source: {
    readonly ruleset: '5e-2024';
    readonly verified: true;
    readonly reference: string;
  };
}
export const equipmentPackageDefinitions = Object.freeze([
  {
    id: 'explorers-pack',
    name: "Explorer's Pack",
    priceCopper: 1000,
    contents: [
      { definitionId: 'backpack', quantity: 1 },
      { definitionId: 'bedroll', quantity: 1 },
      { definitionId: 'mess-kit', quantity: 1 },
      { definitionId: 'tinderbox', quantity: 1 },
      { definitionId: 'torch', quantity: 10 },
      { definitionId: 'rations', quantity: 10 },
      { definitionId: 'waterskin', quantity: 1 },
      { definitionId: 'rope-hempen', quantity: 1 },
    ],
    source: {
      ruleset: '5e-2024',
      verified: true,
      reference: 'Free Rules 2024 / Equipment Packs',
    },
  },
] as const satisfies readonly EquipmentPackageDefinition[]);
export const equipmentPackageRegistry: Readonly<
  Record<string, EquipmentPackageDefinition>
> = Object.freeze(
  Object.fromEntries(
    equipmentPackageDefinitions.map((item) => [item.id, item]),
  ),
);

export function summarizeEquipmentPackage(
  definition: EquipmentPackageDefinition,
) {
  return {
    totalCostCopper: definition.priceCopper,
    totalWeight: definition.contents.reduce(
      (sum, row) =>
        sum + (equipmentRegistry[row.definitionId]?.weight ?? 0) * row.quantity,
      0,
    ),
    itemCount: definition.contents.reduce((sum, row) => sum + row.quantity, 0),
  };
}
export function findPackageDuplicateWarning(
  definitionId: string,
  packageIds: readonly string[],
): string | undefined {
  const item = equipmentRegistry[definitionId];
  const pack = packageIds
    .map((id) => equipmentPackageRegistry[id])
    .find((candidate) =>
      candidate?.contents.some((row) => row.definitionId === definitionId),
    );
  return item && pack
    ? `${item.name} is already included in ${pack.name}. Add another one?`
    : undefined;
}
export function materializeEquipmentPackage(
  packageId: string,
  instancePrefix = `package-${packageId}`,
): readonly InventoryItem[] {
  const definition = equipmentPackageRegistry[packageId];
  if (!definition) throw new Error(`Unknown equipment package: ${packageId}`);
  return definition.contents.map((row, index) => ({
    instanceId: `${instancePrefix}-${index}-${row.definitionId}`,
    definitionId: row.definitionId,
    quantity: row.quantity,
    equipped: false,
    carried: true,
    attuned: false,
    acquisitionSource: { type: 'starting-package', sourceId: definition.name },
  }));
}
export const resolvePackageContents = (
  definition: EquipmentPackageDefinition,
): readonly { definition: EquipmentDefinition; quantity: number }[] =>
  definition.contents
    .map((row) => ({
      definition: equipmentRegistry[row.definitionId],
      quantity: row.quantity,
    }))
    .filter(
      (row): row is { definition: EquipmentDefinition; quantity: number } =>
        !!row.definition,
    );
