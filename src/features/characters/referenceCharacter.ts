import type { CharacterViewModel } from './character.types';
// DEVELOPMENT NOTE: Every numerical value below is fixture UI data and must be replaced by the future rules engine.
export const referenceCharacter: CharacterViewModel = {
  id: 'reference',
  name: 'Reference Character',
  level: 8,
  species: 'Tiefling',
  legacy: 'Chthonic',
  characterClass: 'Druid',
  subclass: 'Circle of the Land',
  background: 'Farmer',
  landType: 'temperate',
  armorClass: 16,
  initiative: 2,
  speed: 30,
  proficiencyBonus: 3,
  currentHp: 46,
  maximumHp: 59,
  temporaryHp: 4,
  hitDice: '8d8',
  passivePerception: 16,
  spellSaveDc: 15,
  spellAttackBonus: 7,
  abilities: {
    strength: {
      score: 10,
      modifier: 0,
      savingThrow: 0,
      proficientInSave: false,
    },
    dexterity: {
      score: 14,
      modifier: 2,
      savingThrow: 2,
      proficientInSave: false,
    },
    constitution: {
      score: 13,
      modifier: 1,
      savingThrow: 1,
      proficientInSave: false,
    },
    intelligence: {
      score: 12,
      modifier: 1,
      savingThrow: 4,
      proficientInSave: true,
    },
    wisdom: { score: 18, modifier: 4, savingThrow: 7, proficientInSave: true },
    charisma: {
      score: 8,
      modifier: -1,
      savingThrow: -1,
      proficientInSave: false,
    },
  },
  spellSlots: [
    { level: 1, current: 2, maximum: 4 },
    { level: 2, current: 1, maximum: 3 },
    { level: 3, current: 2, maximum: 3 },
    { level: 4, current: 0, maximum: 2 },
  ],
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
