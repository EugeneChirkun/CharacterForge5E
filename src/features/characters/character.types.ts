export type AbilityName =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';
export type LandType = 'arid' | 'polar' | 'temperate' | 'tropical';
export type RecoveryType = 'short' | 'long' | 'manual';
export interface AbilityViewModel {
  score: number;
  modifier: number;
  savingThrow: number;
  proficientInSave: boolean;
}
export interface SpellSlotViewModel {
  level: number;
  current: number;
  maximum: number;
}
export interface ResourceViewModel {
  id: string;
  name: string;
  current: number;
  maximum: number;
  recovery: RecoveryType;
}
export interface CharacterViewModel {
  id: string;
  name: string;
  level: number;
  species: string;
  legacy: string;
  characterClass: string;
  subclass: string;
  background: string;
  landType: LandType;
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  currentHp: number;
  maximumHp: number;
  temporaryHp: number;
  hitDice: string;
  passivePerception: number;
  spellSaveDc: number;
  spellAttackBonus: number;
  abilities: Record<AbilityName, AbilityViewModel>;
  spellSlots: SpellSlotViewModel[];
  resources: ResourceViewModel[];
}
export interface StoredApplicationState {
  schemaVersion: 1;
  characters: Record<string, CharacterViewModel>;
  lastCharacterId?: string;
  lastSection?: string;
}
