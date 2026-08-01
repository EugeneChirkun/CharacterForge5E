import { abilityNames } from '../abilities';
import type { CharacterBuild } from '../character';
import { skillNames } from '../skills';
import { evaluateFeatAvailability } from './feat-availability';
import type {
  FeatNestedChoices,
  GeneralFeatDefinition,
} from './feat-definition';

export function validateFeatSelection(
  definition: GeneralFeatDefinition,
  choices: FeatNestedChoices,
  build: CharacterBuild,
  level: number,
): readonly string[] {
  const availability = evaluateFeatAvailability(definition, build, level);
  const errors: string[] =
    availability.status === 'unavailable' ? [availability.message] : [];
  for (const choice of definition.choices) {
    const value = choices[choice.id];
    if (!value) {
      errors.push(`Choose a ${choice.type.replaceAll('-', ' ')}.`);
      continue;
    }
    if (
      (choice.type === 'ability' || choice.type === 'saving-throw') &&
      !abilityNames.includes(value as never)
    )
      errors.push('Choose a valid ability.');
    if (
      (choice.type === 'skill' || choice.type === 'expertise-skill') &&
      !skillNames.includes(value as never)
    )
      errors.push('Choose a valid skill.');
  }
  if (definition.id === 'resilient' && choices.ability !== choices.savingThrow)
    errors.push(
      'Resilient must use the same ability for its increase and saving throw.',
    );
  if (choices.ability && build.abilityScores[choices.ability] >= 20)
    errors.push('The selected ability cannot exceed 20.');
  if (
    choices.savingThrow &&
    build.savingThrowProficiencies.includes(choices.savingThrow)
  )
    errors.push('Choose a saving throw you are not already proficient in.');
  if (choices.skill && build.skillProficiencies.includes(choices.skill))
    errors.push('Choose a skill you are not already proficient in.');
  const expertisePool = [
    ...build.skillProficiencies,
    ...(choices.skill ? [choices.skill] : []),
  ];
  if (
    choices.expertiseSkill &&
    (!expertisePool.includes(choices.expertiseSkill) ||
      build.expertiseSkills.includes(choices.expertiseSkill))
  )
    errors.push(
      'Choose a proficient skill that does not already have expertise.',
    );
  return errors;
}
