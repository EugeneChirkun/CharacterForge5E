import type { AbilityName } from '../abilities';
import type { RuleEffect, RuleSource } from '../rules';
import type { SkillName } from '../skills';

export type FeatureCapabilityId =
  | 'ability-score-increase'
  | 'saving-throw-proficiency'
  | 'skill-proficiency'
  | 'skill-expertise'
  | 'maximum-hit-points'
  | 'weapon-mastery'
  | 'crafting';

export type FeatPrerequisite = {
  readonly type: 'minimum-level';
  readonly level: number;
};
export type FeatChoiceDefinition =
  | { readonly id: 'ability'; readonly type: 'ability'; readonly maximum: 20 }
  | {
      readonly id: 'savingThrow';
      readonly type: 'saving-throw';
      readonly excludeAlreadyProficient: true;
    }
  | {
      readonly id: 'skill';
      readonly type: 'skill';
      readonly excludeAlreadyProficient: true;
    }
  | {
      readonly id: 'expertiseSkill';
      readonly type: 'expertise-skill';
      readonly requiresProficiency: true;
    };

export interface GeneralFeatDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: 'general';
  readonly minimumLevel: number;
  readonly repeatable: boolean;
  readonly prerequisites: readonly FeatPrerequisite[];
  readonly choices: readonly FeatChoiceDefinition[];
  readonly grants: readonly RuleEffect[];
  readonly requiredCapabilities: readonly FeatureCapabilityId[];
  readonly summary: string;
  readonly source: RuleSource;
}

export interface FeatNestedChoices {
  readonly ability?: AbilityName;
  readonly savingThrow?: AbilityName;
  readonly skill?: SkillName;
  readonly expertiseSkill?: SkillName;
}

export interface GeneralFeatSelection {
  readonly featId: string;
  readonly choices: FeatNestedChoices;
}
