import type { AbilityScores } from '../abilities';

export interface BeastDefinition {
  readonly id: string;
  readonly name: string;
  readonly challengeRating: number;
  readonly armorClass: number;
  readonly hitPoints: number;
  readonly size: string;
  readonly speed: string;
  readonly speedFeet: number;
  readonly abilityScores: AbilityScores;
  readonly skills: Readonly<Record<string, number>>;
  readonly senses: readonly string[];
  readonly actions: readonly string[];
  readonly traits: readonly string[];
  readonly source: string;
  readonly verified: boolean;
}

export const beastRegistry: Readonly<Record<string, BeastDefinition>> =
  Object.freeze({
    wolf: Object.freeze({
      id: 'wolf',
      name: 'Wolf',
      challengeRating: 0.25,
      armorClass: 13,
      hitPoints: 11,
      size: 'Medium',
      speed: '40 ft.',
      speedFeet: 40,
      abilityScores: {
        strength: 12,
        dexterity: 15,
        constitution: 12,
        intelligence: 3,
        wisdom: 12,
        charisma: 6,
      },
      skills: { perception: 3, stealth: 4 },
      senses: ['Passive Perception 13'],
      actions: ['Bite'],
      traits: ['Keen Hearing and Smell', 'Pack Tactics'],
      source: 'SRD 5.1',
      verified: true,
    }),
    'brown-bear': Object.freeze({
      id: 'brown-bear',
      name: 'Brown Bear',
      challengeRating: 1,
      armorClass: 11,
      hitPoints: 34,
      size: 'Large',
      speed: '40 ft., climb 30 ft.',
      speedFeet: 40,
      abilityScores: {
        strength: 19,
        dexterity: 10,
        constitution: 16,
        intelligence: 2,
        wisdom: 13,
        charisma: 7,
      },
      skills: { perception: 3 },
      senses: ['Passive Perception 13'],
      actions: ['Multiattack', 'Bite', 'Claws'],
      traits: ['Keen Smell'],
      source: 'SRD 5.1',
      verified: true,
    }),
    'giant-badger': Object.freeze({
      id: 'giant-badger',
      name: 'Giant Badger',
      challengeRating: 0.25,
      armorClass: 10,
      hitPoints: 13,
      size: 'Medium',
      speed: '30 ft., burrow 10 ft.',
      speedFeet: 30,
      abilityScores: {
        strength: 13,
        dexterity: 10,
        constitution: 15,
        intelligence: 2,
        wisdom: 12,
        charisma: 5,
      },
      skills: {},
      senses: ['Darkvision 30 ft.', 'Passive Perception 11'],
      actions: ['Multiattack', 'Bite', 'Claws'],
      traits: ['Keen Smell'],
      source: 'SRD 5.1',
      verified: true,
    }),
  });
