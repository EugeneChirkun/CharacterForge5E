export interface EquipmentDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: 'preset';
  readonly quantity: number;
}
export const equipmentDefinitions: readonly EquipmentDefinition[] = [
  {
    id: 'druid-farmer-preset',
    name: 'Druid & Farmer MVP starting equipment',
    category: 'preset',
    quantity: 1,
  },
];
export type EquipmentDiagnostic = {
  readonly type: 'missing-equipment-choice' | 'invalid-equipment-choice';
};
export function validateEquipment(
  ids: readonly string[],
): readonly EquipmentDiagnostic[] {
  if (ids.length !== 1)
    return [
      {
        type: ids.length
          ? 'invalid-equipment-choice'
          : 'missing-equipment-choice',
      },
    ];
  return ids[0] === equipmentDefinitions[0].id
    ? []
    : [{ type: 'invalid-equipment-choice' }];
}
