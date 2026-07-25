import {
  CharacterValidationError,
  type CalculationResult,
} from '../calculation';

export const abilityNames = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const;
export type AbilityName = (typeof abilityNames)[number];
export type AbilityScores = Readonly<Record<AbilityName, number>>;

export function getAbilityModifier(score: number): CalculationResult<number> {
  if (!Number.isInteger(score) || score < 1 || score > 30)
    throw new CharacterValidationError(
      'INVALID_ABILITY_SCORE',
      'Ability scores must be integers from 1 to 30.',
    );
  const value = Math.floor((score - 10) / 2);
  return {
    value,
    steps: [
      { label: 'Ability score modifier', value, source: `Score ${score}` },
    ],
  };
}
