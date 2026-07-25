import {
  CharacterValidationError,
  type CalculationResult,
} from '../calculation';

export function getProficiencyBonus(level: number): CalculationResult<number> {
  if (!Number.isInteger(level) || level < 1 || level > 20)
    throw new CharacterValidationError(
      'INVALID_LEVEL',
      'Character level must be an integer from 1 to 20.',
    );
  const value = 2 + Math.floor((level - 1) / 4);
  return {
    value,
    steps: [{ label: 'Proficiency bonus', value, source: `Level ${level}` }],
  };
}
