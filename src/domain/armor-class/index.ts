import type { AbilityName } from '../abilities';
import {
  CharacterValidationError,
  type CalculationResult,
} from '../calculation';

export type ArmorClassSource =
  | {
      readonly type: 'unarmored';
      readonly base: number;
      readonly abilityModifiers: readonly AbilityName[];
      readonly label: string;
    }
  | {
      readonly type: 'armor';
      readonly base: number;
      readonly dexterityCap?: number;
      readonly label: string;
    }
  | {
      readonly type: 'shield' | 'flat-bonus';
      readonly amount: number;
      readonly label: string;
    };

export function calculateArmorClass(input: {
  readonly sources: readonly ArmorClassSource[];
  readonly abilityModifiers: Readonly<Record<AbilityName, number>>;
}): CalculationResult<number> {
  const bases = input.sources.filter(
    (s): s is Extract<ArmorClassSource, { type: 'armor' | 'unarmored' }> =>
      s.type === 'armor' || s.type === 'unarmored',
  );
  if (!bases.length)
    throw new CharacterValidationError(
      'MALFORMED_AC',
      'At least one AC base formula is required.',
    );
  const candidates = bases.map((source) => {
    if (!Number.isFinite(source.base) || source.base < 0)
      throw new CharacterValidationError(
        'MALFORMED_AC',
        'AC bases must be non-negative numbers.',
      );
    const modifiers =
      source.type === 'unarmored'
        ? source.abilityModifiers.map((ability) => ({
            label: `${ability} modifier`,
            value: input.abilityModifiers[ability],
          }))
        : [
            {
              label: 'Dexterity modifier',
              value: Math.min(
                input.abilityModifiers.dexterity,
                source.dexterityCap ?? Infinity,
              ),
            },
          ];
    return {
      value: source.base + modifiers.reduce((sum, step) => sum + step.value, 0),
      steps: [{ label: source.label, value: source.base }, ...modifiers],
    };
  });
  const selected = candidates.reduce((best, candidate) =>
    candidate.value > best.value ? candidate : best,
  );
  const bonuses = input.sources.filter(
    (s): s is Extract<ArmorClassSource, { type: 'shield' | 'flat-bonus' }> =>
      s.type === 'shield' || s.type === 'flat-bonus',
  );
  return {
    value: selected.value + bonuses.reduce((sum, b) => sum + b.amount, 0),
    steps: [
      ...selected.steps,
      ...bonuses.map((b) => ({ label: b.label, value: b.amount })),
    ],
  };
}
