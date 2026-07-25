import type { AbilityName } from '../abilities';
import {
  CharacterValidationError,
  type CalculationResult,
} from '../calculation';
export interface SpellcastingBuild {
  readonly ability: AbilityName;
  readonly slotProgression: Readonly<
    Record<number, Readonly<Record<number, number>>>
  >;
}
export interface ComputedSpellSlot {
  readonly level: number;
  readonly maximum: number;
  readonly spent: number;
  readonly remaining: number;
}
export type ComputedSpellSlots = Readonly<Record<number, ComputedSpellSlot>>;
export interface ComputedSpellcasting {
  readonly ability: AbilityName;
  readonly abilityModifier: CalculationResult<number>;
  readonly spellSaveDc: CalculationResult<number>;
  readonly spellAttackBonus: CalculationResult<number>;
  readonly slots: ComputedSpellSlots;
}
export function calculateSpellSaveDc(input: {
  readonly proficiencyBonus: number;
  readonly abilityModifier: number;
}): CalculationResult<number> {
  return {
    value: 8 + input.proficiencyBonus + input.abilityModifier,
    steps: [
      { label: 'Base', value: 8 },
      { label: 'Proficiency Bonus', value: input.proficiencyBonus },
      { label: 'Spellcasting Ability Modifier', value: input.abilityModifier },
    ],
  };
}
export function calculateSpellAttackBonus(input: {
  readonly proficiencyBonus: number;
  readonly abilityModifier: number;
}): CalculationResult<number> {
  return {
    value: input.proficiencyBonus + input.abilityModifier,
    steps: [
      { label: 'Proficiency Bonus', value: input.proficiencyBonus },
      { label: 'Spellcasting Ability Modifier', value: input.abilityModifier },
    ],
  };
}
export function calculateSpellSlots(input: {
  readonly level: number;
  readonly progression: SpellcastingBuild['slotProgression'];
  readonly spent: Readonly<Record<number, number>>;
}): ComputedSpellSlots {
  const maximums = input.progression[input.level];
  if (!maximums)
    throw new CharacterValidationError(
      'MISSING_SLOT_PROGRESSION',
      `No slot progression for level ${input.level}.`,
    );
  const result: Record<number, ComputedSpellSlot> = {};
  for (const [key, maximum] of Object.entries(maximums)) {
    const spellLevel = Number(key),
      spent = input.spent[spellLevel] ?? 0;
    if (
      !Number.isInteger(maximum) ||
      maximum < 0 ||
      !Number.isInteger(spent) ||
      spent < 0 ||
      spent > maximum
    )
      throw new CharacterValidationError(
        'INVALID_SPENT_SPELL_SLOTS',
        `Invalid spent slots at spell level ${spellLevel}.`,
      );
    result[spellLevel] = {
      level: spellLevel,
      maximum,
      spent,
      remaining: maximum - spent,
    };
  }
  for (const key of Object.keys(input.spent))
    if (!(Number(key) in maximums) && input.spent[Number(key)] !== 0)
      throw new CharacterValidationError(
        'INVALID_SPENT_SPELL_SLOTS',
        `No slots exist at spell level ${key}.`,
      );
  return result;
}
