import { abilityNames, type AbilityName } from '../abilities';
import type { CharacterBuild } from '../character';
import { skillNames, type SkillName } from '../skills';
import type {
  FeatChoiceDefinition,
  FeatNestedChoices,
} from './feat-definition';

/** The common rules-layer projection consumed by all choice controls. */
export interface ChoiceOptionResult<T extends string = string> {
  readonly id: T;
  readonly label: string;
  readonly visible: boolean;
  readonly enabled: boolean;
  readonly disabledReason?: string;
}
export interface ChoiceEvaluation<T extends string = string> {
  readonly options: readonly ChoiceOptionResult<T>[];
  readonly selectedValue?: T;
  readonly clearedReason?: string;
}
export interface ChoiceFilterContext {
  readonly build: CharacterBuild;
  readonly selections: FeatNestedChoices;
}

const label = (id: string) =>
  id.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());

/** Generic evaluator entry point. React only renders this rules-owned result. */
export function evaluateChoiceDefinition(
  definition: FeatChoiceDefinition,
  context: ChoiceFilterContext,
): ChoiceEvaluation<AbilityName | SkillName> {
  const selected = context.selections[definition.id];
  let legal: readonly (AbilityName | SkillName)[];
  switch (definition.type) {
    case 'ability':
      legal = abilityNames.filter(
        (ability) => context.build.abilityScores[ability] < definition.maximum,
      );
      break;
    case 'saving-throw':
      legal = abilityNames.filter(
        (ability) =>
          !definition.excludeAlreadyProficient ||
          !context.build.savingThrowProficiencies.includes(ability),
      );
      break;
    case 'skill':
      legal = skillNames.filter(
        (skill) =>
          (!definition.excludeAlreadyProficient ||
            !context.build.skillProficiencies.includes(skill)) &&
          context.selections.expertiseSkill !== skill,
      );
      break;
    case 'expertise-skill': {
      const proficient = new Set([
        ...context.build.skillProficiencies,
        ...(context.selections.skill ? [context.selections.skill] : []),
      ]);
      legal = skillNames.filter(
        (skill) =>
          (!definition.requiresProficiency || proficient.has(skill)) &&
          !context.build.expertiseSkills.includes(skill) &&
          context.selections.skill !== skill,
      );
      break;
    }
  }
  const selectedValue = legal.includes(selected as never)
    ? (selected as AbilityName | SkillName | undefined)
    : undefined;
  return {
    options: legal.map((id) => ({
      id,
      label: label(id),
      visible: true,
      enabled: true,
    })),
    selectedValue,
    ...(selected && !selectedValue
      ? {
          clearedReason: `${label(selected)} is no longer legal for this choice and was cleared.`,
        }
      : {}),
  };
}

/** Clears stale/hidden values until interdependent choices reach a valid fixed point. */
export function reconcileFeatChoices(
  definitions: readonly FeatChoiceDefinition[],
  build: CharacterBuild,
  selections: FeatNestedChoices,
): {
  readonly choices: FeatNestedChoices;
  readonly explanations: readonly string[];
} {
  let choices = { ...selections };
  const explanations: string[] = [];
  for (let pass = 0; pass < definitions.length + 1; pass += 1) {
    let changed = false;
    for (const definition of definitions) {
      const result = evaluateChoiceDefinition(definition, {
        build,
        selections: choices,
      });
      if (choices[definition.id] && !result.selectedValue) {
        const remaining = { ...choices };
        delete remaining[definition.id];
        choices = remaining;
        if (result.clearedReason) explanations.push(result.clearedReason);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { choices, explanations: [...new Set(explanations)] };
}
