import type { AbilityName } from '../abilities';
import type { SkillName } from '../skills';

export interface RuleSource {
  readonly ruleset: '5e-2024';
  readonly sourceId: string;
  readonly sourceType: 'srd' | 'private-reference';
  readonly section?: string;
  readonly page?: number;
  readonly verified: boolean;
}
export type DruidPrimalOrderId = 'magician' | 'warden';
export type DruidPrimalOrderSkill = 'arcana' | 'nature';
export interface DruidPrimalOrderSelection {
  readonly orderId: DruidPrimalOrderId;
  readonly magicianChoices?: {
    readonly additionalCantripId: string;
    readonly skillBonusTarget: DruidPrimalOrderSkill;
  };
}
export interface DruidPrimalOrderDefinition {
  readonly id: DruidPrimalOrderId;
  readonly name: string;
  readonly grants: readonly (
    | 'additional-druid-cantrip'
    | 'wisdom-skill-bonus'
    | 'medium-armor'
    | 'martial-weapons'
  )[];
  readonly choices: readonly ('additional-cantrip' | 'skill-bonus-target')[];
  readonly source: RuleSource;
}
export type OwnerType =
  'class' | 'subclass' | 'species' | 'background' | 'feat';
export type DamageType = 'fire' | 'necrotic' | 'poison';
export type RuleEffect =
  | {
      readonly type: 'grant-saving-throw-proficiency';
      readonly ability: AbilityName;
    }
  | { readonly type: 'grant-skill-proficiency'; readonly skill: SkillName }
  | { readonly type: 'grant-resource'; readonly resourceId: string }
  | { readonly type: 'grant-spell'; readonly grantId: string }
  | { readonly type: 'grant-resistance'; readonly damageType: DamageType }
  | { readonly type: 'modify-hit-points-per-level'; readonly amount: number }
  | { readonly type: 'unlock-subclass'; readonly level: number };
export interface FeatureDefinition {
  readonly id: string;
  readonly name: string;
  readonly ownerType: OwnerType;
  readonly ownerId: string;
  readonly level: number;
  readonly summary: string;
  readonly effects: readonly RuleEffect[];
  readonly source: RuleSource;
}
export interface ClassLevelDefinition {
  readonly level: number;
  readonly featureIds: readonly string[];
  readonly cantripsKnown: number;
  readonly preparedSpells: number;
  readonly spellSlots: Readonly<Record<number, number>>;
  readonly resourceMaximums: Readonly<Record<string, number>>;
}
export interface ClassDefinition {
  readonly id: string;
  readonly name: string;
  readonly hitDie: number;
  readonly primaryAbility: AbilityName;
  readonly savingThrows: readonly AbilityName[];
  readonly availableSkills: readonly SkillName[];
  readonly skillChoices: number;
  readonly armorTraining: readonly string[];
  readonly weaponTraining: readonly string[];
  readonly toolTraining: readonly string[];
  readonly spellcastingAbility: AbilityName;
  readonly subclassUnlockLevel: number;
  readonly progression: readonly ClassLevelDefinition[];
  readonly featureIds: readonly string[];
  readonly source: RuleSource;
}
export interface SubclassDefinition {
  readonly id: string;
  readonly name: string;
  readonly parentClassId: string;
  readonly unlockLevel: number;
  readonly featureIds: readonly string[];
  readonly source: RuleSource;
}
export interface SpeciesDefinition {
  readonly id: string;
  readonly name: string;
  readonly creatureType: string;
  readonly size: string;
  readonly speed: number;
  readonly featureIds: readonly string[];
  readonly optionIds: readonly string[];
  readonly source: RuleSource;
}
export interface SpeciesOptionDefinition {
  readonly id: string;
  readonly name: string;
  readonly parentSpeciesId: string;
  readonly featureIds: readonly string[];
  readonly grantIds: readonly string[];
  readonly source: RuleSource;
}
export interface BackgroundDefinition {
  readonly id: string;
  readonly name: string;
  readonly abilityOptions: readonly AbilityName[];
  readonly skills: readonly SkillName[];
  readonly tool: string;
  readonly originFeatId: string;
  readonly equipmentRefs: readonly string[];
  readonly featureIds: readonly string[];
  readonly source: RuleSource;
}
export interface FeatDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: 'origin';
  readonly featureIds: readonly string[];
  readonly source: RuleSource;
}
export type RestType = 'short' | 'long';
export type ResourceMaximumFormula =
  | { readonly type: 'constant'; readonly value: number }
  | {
      readonly type: 'by-class-level';
      readonly classId: string;
      readonly values: Readonly<Record<number, number>>;
    };
export interface RecoveryRule {
  readonly restType: RestType;
  readonly amount: 'all' | number;
}
export interface ResourceDefinition {
  readonly id: string;
  readonly name: string;
  readonly ownerType: OwnerType;
  readonly ownerId: string;
  readonly minimumLevel: number;
  readonly maximum: ResourceMaximumFormula;
  readonly recovery: readonly RecoveryRule[];
  readonly source: RuleSource;
}
export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type SpellSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';
export type SpellTag =
  | 'healing'
  | 'attack'
  | 'control'
  | 'utility'
  | 'summoning'
  | 'movement'
  | 'detection'
  | 'protection';
export interface SpellComponents {
  readonly verbal: boolean;
  readonly somatic: boolean;
  readonly material: boolean;
  /** A non-copyrighted indicator only; material prose is deliberately not stored. */
  readonly materialRequirement?: string;
}
export interface SpellDefinition {
  readonly id: string;
  readonly name: string;
  readonly level: SpellLevel;
  readonly school: SpellSchool;
  readonly classIds: readonly string[];
  readonly ritual: boolean;
  readonly concentration: boolean;
  readonly castingTime: string;
  readonly range: string;
  readonly duration: string;
  readonly components: SpellComponents;
  readonly tags: readonly SpellTag[];
  /** Reserved for user-imported, appropriately licensed content. */
  readonly description?: string;
  readonly source: RuleSource;
}
export type SpellGrantSourceType =
  'class' | 'subclass' | 'species' | 'primal-order';
export interface SpellGrant {
  readonly id: string;
  readonly spellId: string;
  readonly sourceType: SpellGrantSourceType;
  readonly sourceId: string;
  readonly unlockedAtCharacterLevel: number;
  readonly landType?: LandType;
  readonly alwaysPrepared: boolean;
  readonly countsAgainstPreparedLimit: boolean;
  readonly castingAbility: AbilityName;
  readonly mayUseSpellSlots: boolean;
  readonly freeUseResourceId?: string;
  readonly source: RuleSource;
}
export type LandType = 'arid' | 'polar' | 'temperate' | 'tropical';
export interface RuleRegistry {
  readonly druidPrimalOrders: Readonly<
    Record<DruidPrimalOrderId, DruidPrimalOrderDefinition>
  >;
  readonly classes: Readonly<Record<string, ClassDefinition>>;
  readonly subclasses: Readonly<Record<string, SubclassDefinition>>;
  readonly species: Readonly<Record<string, SpeciesDefinition>>;
  readonly speciesOptions: Readonly<Record<string, SpeciesOptionDefinition>>;
  readonly backgrounds: Readonly<Record<string, BackgroundDefinition>>;
  readonly feats: Readonly<Record<string, FeatDefinition>>;
  readonly features: Readonly<Record<string, FeatureDefinition>>;
  readonly spells: Readonly<Record<string, SpellDefinition>>;
  readonly spellGrants: Readonly<Record<string, SpellGrant>>;
  readonly resources: Readonly<Record<string, ResourceDefinition>>;
}
export type RuleDiagnostic =
  | {
      readonly type: 'unknown-rule-id';
      readonly category: string;
      readonly id: string;
    }
  | {
      readonly type: 'subclass-does-not-belong-to-class';
      readonly subclassId: string;
      readonly classId: string;
    }
  | {
      readonly type: 'subclass-selected-before-unlock';
      readonly subclassId: string;
      readonly level: number;
    }
  | {
      readonly type:
        | 'missing-required-land-selection'
        | 'invalid-land-selection'
        | 'unsupported-character-level'
        | 'missing-primal-order'
        | 'invalid-primal-order'
        | 'missing-magician-cantrip'
        | 'invalid-magician-cantrip'
        | 'missing-magician-skill-choice'
        | 'stale-primal-order-choice'
        | 'duplicate-cantrip-selection';
      readonly value?: string | number;
    }
  | {
      readonly type: 'invalid-resource-state';
      readonly resourceId: string;
      readonly remaining: number;
      readonly maximum: number;
    }
  | { readonly type: 'unverified-rule'; readonly ruleId: string }
  | {
      readonly type:
        | 'invalid-character-state'
        | 'invalid-wild-shape'
        | 'unknown-beast'
        | 'no-wild-shape-uses'
        | 'invalid-transformation'
        | 'invalid-reversion';
    };
