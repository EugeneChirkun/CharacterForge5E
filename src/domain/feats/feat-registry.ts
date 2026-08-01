import { phb2024 } from '../rules/registry';
import type { GeneralFeatDefinition } from './feat-definition';

const definitions = [
  {
    id: 'resilient',
    name: 'Resilient',
    category: 'general',
    minimumLevel: 4,
    repeatable: false,
    prerequisites: [{ type: 'minimum-level', level: 4 }],
    choices: [
      { id: 'ability', type: 'ability', maximum: 20 },
      {
        id: 'savingThrow',
        type: 'saving-throw',
        excludeAlreadyProficient: true,
      },
    ],
    grants: [],
    requiredCapabilities: [
      'ability-score-increase',
      'saving-throw-proficiency',
    ],
    summary:
      'Increase one ability by 1 and gain proficiency in its saving throw.',
    source: phb2024,
  },
  {
    id: 'skill-expert',
    name: 'Skill Expert',
    category: 'general',
    minimumLevel: 4,
    repeatable: false,
    prerequisites: [{ type: 'minimum-level', level: 4 }],
    choices: [
      { id: 'ability', type: 'ability', maximum: 20 },
      { id: 'skill', type: 'skill', excludeAlreadyProficient: true },
      {
        id: 'expertiseSkill',
        type: 'expertise-skill',
        requiresProficiency: true,
      },
    ],
    grants: [],
    requiredCapabilities: [
      'ability-score-increase',
      'skill-proficiency',
      'skill-expertise',
    ],
    summary:
      'Increase one ability by 1, learn a skill, and gain expertise in a proficient skill.',
    source: phb2024,
  },
  {
    id: 'tough',
    name: 'Tough',
    category: 'general',
    minimumLevel: 4,
    repeatable: false,
    prerequisites: [{ type: 'minimum-level', level: 4 }],
    choices: [],
    grants: [{ type: 'modify-hit-points-per-level', amount: 2 }],
    requiredCapabilities: ['maximum-hit-points'],
    summary: 'Increase maximum Hit Points by 2 per character level.',
    source: phb2024,
  },
] as const satisfies readonly GeneralFeatDefinition[];

export const generalFeatRegistry: Readonly<
  Record<string, GeneralFeatDefinition>
> = Object.freeze(
  Object.fromEntries(
    [...definitions]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((feat) => [feat.id, Object.freeze(feat)]),
  ),
);

export interface UnavailableFeatDefinition {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly requiredCapabilities: readonly import('./feat-definition').FeatureCapabilityId[];
}
export const unavailableGeneralFeatCatalog: readonly UnavailableFeatDefinition[] =
  Object.freeze([
    {
      id: 'crafter',
      name: 'Crafter',
      summary: 'Crafting rules are not installed.',
      requiredCapabilities: ['crafting'],
    },
    {
      id: 'weapon-master',
      name: 'Weapon Master',
      summary:
        'Weapon Mastery is not implemented in the current rules package.',
      requiredCapabilities: ['weapon-mastery'],
    },
  ]);
