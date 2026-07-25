import type { AbilityName } from '../abilities';
import {
  CharacterValidationError,
  type CalculationResult,
} from '../calculation';

export const skillToAbility = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
} as const satisfies Record<string, AbilityName>;
export type SkillName = keyof typeof skillToAbility;
export const skillNames = Object.keys(skillToAbility) as SkillName[];

export interface SkillInput {
  readonly skill: SkillName;
  readonly abilityModifier: number;
  readonly proficiencyBonus: number;
  readonly proficient: boolean;
  readonly expertise: boolean;
}
export function calculateSkillModifier(
  input: SkillInput,
): CalculationResult<number> {
  if (input.expertise && !input.proficient)
    throw new CharacterValidationError(
      'INVALID_PROFICIENCY_STATE',
      'Expertise requires proficiency.',
    );
  const multiplier = input.expertise ? 2 : input.proficient ? 1 : 0;
  const bonus = input.proficiencyBonus * multiplier;
  return {
    value: input.abilityModifier + bonus,
    steps: [
      {
        label: `${skillToAbility[input.skill]} modifier`,
        value: input.abilityModifier,
      },
      ...(multiplier
        ? [
            {
              label: input.expertise ? 'Expertise' : 'Proficiency bonus',
              value: bonus,
            },
          ]
        : []),
    ],
  };
}
