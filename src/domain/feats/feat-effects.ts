import type { CharacterBuild } from '../character';
import type {
  FeatNestedChoices,
  GeneralFeatDefinition,
} from './feat-definition';

export function applyGeneralFeatEffects(
  build: CharacterBuild,
  definition: GeneralFeatDefinition,
  choices: FeatNestedChoices,
): CharacterBuild {
  const abilityScores = { ...build.abilityScores };
  if (choices.ability) abilityScores[choices.ability] += 1;
  return {
    ...build,
    abilityScores,
    savingThrowProficiencies: choices.savingThrow
      ? [...new Set([...build.savingThrowProficiencies, choices.savingThrow])]
      : build.savingThrowProficiencies,
    skillProficiencies: choices.skill
      ? [...new Set([...build.skillProficiencies, choices.skill])]
      : build.skillProficiencies,
    expertiseSkills: choices.expertiseSkill
      ? [...new Set([...build.expertiseSkills, choices.expertiseSkill])]
      : build.expertiseSkills,
    featIds: [...new Set([...(build.featIds ?? []), definition.id])],
  };
}
