import type { AbilityName } from '../../domain/abilities';
import type { SkillName } from '../../domain/skills';
import type { CharacterInventory } from '../../domain/equipment';
import type {
  BeastDefinition,
  CharacterState,
} from '../../domain/character-state';
export type { AbilityName } from '../../domain/abilities';
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
  recoveryOn?: readonly ('short' | 'long')[];
}
export interface CharacterViewModel {
  characterState: CharacterState;
  characterStateHistory?: readonly CharacterState[];
  availableWildShapeForms: readonly BeastDefinition[];
  baseArmorClass?: number;
  baseSpeed?: number;
  baseAbilities?: Record<AbilityName, AbilityViewModel>;
  primalOrder?: {
    name: string;
    additionalCantrip?: string;
    skillBonusTarget?: 'arcana' | 'nature';
    grantedProficiencies: readonly string[];
  };
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
  baseMaximumHp?: number;
  maximumHpAdjustment?: number;
  maximumHpAdjustmentReason?: string;
  temporaryHp: number;
  hitDice: string;
  passivePerception: number;
  spellSaveDc: number;
  spellAttackBonus: number;
  abilities: Record<AbilityName, AbilityViewModel>;
  skills: Record<SkillName, number>;
  skillProficiencies: readonly SkillName[];
  proficiencies: readonly {
    category: string;
    items: readonly string[];
  }[];
  languages: readonly string[];
  senses: readonly string[];
  spellSlots: SpellSlotViewModel[];
  resources: ResourceViewModel[];
  features: readonly {
    id: string;
    name: string;
    sourceType: 'class' | 'subclass' | 'species' | 'background' | 'feat';
    summary: string;
  }[];
  spells: readonly {
    id: string;
    name: string;
    level: number;
    sources: readonly ('class' | 'subclass' | 'species' | 'primal-order')[];
    alwaysPrepared: boolean;
  }[];
  diagnostics: readonly string[];
  diagnosticGroups?: {
    readonly build: readonly string[];
    readonly spellPreparation: readonly string[];
    readonly session: readonly string[];
  };
  conditions?: readonly string[];
  concentrationSpellId?: string;
  preparedSpellIds?: readonly string[];
  inventory: CharacterInventory;
  carriedWeight: number;
  ownedWeight: number;
  armorClassExplanation: readonly string[];
}
export interface StoredApplicationState {
  schemaVersion: 2;
  characters: Record<string, CharacterViewModel>;
  lastCharacterId?: string;
  lastSection?: string;
}
