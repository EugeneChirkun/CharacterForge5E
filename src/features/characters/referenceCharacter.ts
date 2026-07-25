import { abilityNames } from '../../domain/abilities';
import {
  computeCharacter,
  type CharacterBuild,
  type CharacterSession,
} from '../../domain/character';
import { skillNames } from '../../domain/skills';
import type { CharacterViewModel } from './character.types';

export const referenceBuild: CharacterBuild = {
  id: 'reference',
  name: 'Reference Character',
  ruleset: '5e-2024',
  totalLevel: 8,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 17,
    intelligence: 10,
    wisdom: 20,
    charisma: 8,
  },
  hitPointProgression: {
    hitDie: 8,
    levelGains: Array.from({ length: 8 }, (_, index) => ({
      level: index + 1,
      baseHitPoints: index === 0 ? 8 : 5,
    })),
    perLevelBonuses: [{ source: 'Tough', amount: 2 }],
    flatBonuses: [],
  },
  savingThrowProficiencies: ['intelligence', 'wisdom'],
  skillProficiencies: ['animalHandling', 'nature', 'perception'],
  expertiseSkills: [],
  armorClassSources: [
    { type: 'armor', base: 12, dexterityCap: 2, label: 'Equipped armor' },
    { type: 'shield', amount: 2, label: 'Shield' },
  ],
  spellcasting: {
    ability: 'wisdom',
    slotProgression: { 8: { 1: 4, 2: 3, 3: 3, 4: 2 } },
  },
  feats: ['Tough'],
};
export const referenceSession: CharacterSession = {
  currentHp: 46,
  temporaryHp: 4,
  spentHitDice: 0,
  spentSpellSlots: { 1: 2, 2: 2, 3: 1, 4: 2 },
  resources: { 'wild-shape': 0, 'nature-aid': 0, token: 0 },
  conditions: [],
};

const computed = computeCharacter(referenceBuild, referenceSession);
export const referenceCharacter: CharacterViewModel = {
  id: referenceBuild.id,
  name: referenceBuild.name,
  level: referenceBuild.totalLevel,
  species: 'Tiefling',
  legacy: 'Chthonic',
  characterClass: 'Druid',
  subclass: 'Circle of the Land',
  background: 'Farmer',
  landType: 'temperate',
  speed: 30,
  armorClass: computed.armorClass.value,
  initiative: computed.initiative.value,
  proficiencyBonus: computed.proficiencyBonus.value,
  currentHp: computed.currentHp,
  maximumHp: computed.maximumHp.value,
  temporaryHp: computed.temporaryHp,
  hitDice: '8d8',
  passivePerception: computed.passivePerception.value,
  spellSaveDc: computed.spellcasting?.spellSaveDc.value ?? 0,
  spellAttackBonus: computed.spellcasting?.spellAttackBonus.value ?? 0,
  abilities: Object.fromEntries(
    abilityNames.map((name) => [
      name,
      {
        score: referenceBuild.abilityScores[name],
        modifier: computed.abilityModifiers[name].value,
        savingThrow: computed.savingThrows[name].value,
        proficientInSave:
          referenceBuild.savingThrowProficiencies.includes(name),
      },
    ]),
  ) as CharacterViewModel['abilities'],
  skills: Object.fromEntries(
    skillNames.map((name) => [name, computed.skills[name].value]),
  ) as CharacterViewModel['skills'],
  spellSlots: Object.values(computed.spellcasting?.slots ?? {}).map((slot) => ({
    level: slot.level,
    current: slot.remaining,
    maximum: slot.maximum,
  })),
  resources: [
    {
      id: 'wild-shape',
      name: 'Wild Shape',
      current: 0,
      maximum: 2,
      recovery: 'short',
    },
    {
      id: 'nature-aid',
      name: 'Nature Aid',
      current: 0,
      maximum: 1,
      recovery: 'long',
    },
    {
      id: 'token',
      name: 'Story Token',
      current: 0,
      maximum: 1,
      recovery: 'manual',
    },
  ],
};
export const freshReferenceCharacter = () =>
  structuredClone(referenceCharacter);
