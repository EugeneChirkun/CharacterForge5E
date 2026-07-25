import type { CalculationResult, FlatModifier } from '../calculation';

const addModifiers = (
  base: number,
  label: string,
  modifiers: readonly FlatModifier[],
): CalculationResult<number> => ({
  value: base + modifiers.reduce((sum, item) => sum + item.amount, 0),
  steps: [
    { label, value: base },
    ...modifiers.map((item) => ({
      label: 'Flat modifier',
      value: item.amount,
      source: item.source,
    })),
  ],
});
export function calculateSavingThrow(input: {
  readonly abilityModifier: number;
  readonly proficiencyBonus: number;
  readonly proficient: boolean;
  readonly modifiers?: readonly FlatModifier[];
}): CalculationResult<number> {
  const proficiency = input.proficient ? input.proficiencyBonus : 0;
  const result = addModifiers(
    input.abilityModifier + proficiency,
    'Ability modifier',
    input.modifiers ?? [],
  );
  return {
    ...result,
    steps: [
      { label: 'Ability modifier', value: input.abilityModifier },
      ...(input.proficient
        ? [{ label: 'Proficiency bonus', value: proficiency }]
        : []),
      ...result.steps.slice(1),
    ],
  };
}
export const calculateInitiative = (input: {
  readonly dexterityModifier: number;
  readonly modifiers?: readonly FlatModifier[];
}) =>
  addModifiers(
    input.dexterityModifier,
    'Dexterity modifier',
    input.modifiers ?? [],
  );
export function calculatePassivePerception(
  perception: CalculationResult<number>,
): CalculationResult<number> {
  return {
    value: 10 + perception.value,
    steps: [
      { label: 'Base', value: 10 },
      { label: 'Perception modifier', value: perception.value },
    ],
  };
}
