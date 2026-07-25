import type { AbilityName, AbilityScores } from '../abilities';
import type { ArmorClassSource } from '../armor-class';
import type { CalculationResult } from '../calculation';
import type { HitPointProgression } from '../hit-points';
import type { SkillName } from '../skills';
import type { ComputedSpellcasting, SpellcastingBuild } from '../spellcasting';
import type { LandType, RuleDiagnostic, SpellGrantSourceType } from '../rules';
import type { ComputedResource } from '../resources';
import type { SpellDiagnostic } from '../spells';
export interface CharacterBuild {
  readonly id: string;
  readonly name: string;
  readonly ruleset: '5e-2024';
  readonly totalLevel: number;
  readonly abilityScores: AbilityScores;
  readonly hitPointProgression: HitPointProgression;
  readonly savingThrowProficiencies: readonly AbilityName[];
  readonly skillProficiencies: readonly SkillName[];
  readonly expertiseSkills: readonly SkillName[];
  readonly armorClassSources: readonly ArmorClassSource[];
  readonly spellcasting?: SpellcastingBuild;
  readonly feats: readonly string[];
  readonly class?: {
    readonly classId: string;
    readonly level: number;
    readonly subclassId?: string;
  };
  readonly species?: {
    readonly speciesId: string;
    readonly optionId?: string;
    readonly spellcastingAbility?: AbilityName;
  };
  readonly backgroundId?: string;
  readonly featIds?: readonly string[];
  readonly preparedSpellIds?: readonly string[];
  readonly cantripIds?: readonly string[];
}
export interface CharacterSession {
  readonly currentHp: number;
  readonly temporaryHp: number;
  readonly spentHitDice: number;
  readonly spentSpellSlots: Readonly<Record<number, number>>;
  readonly resources: Readonly<Record<string, number>>;
  readonly conditions: readonly string[];
  readonly selections?: {
    readonly circleOfTheLand?: { readonly landType: LandType };
  };
}
export interface ComputedFeature {
  readonly id: string;
  readonly name: string;
  readonly sourceType: 'class' | 'subclass' | 'species' | 'background' | 'feat';
  readonly sourceId: string;
  readonly summary: string;
}
export interface ComputedSpellAccess {
  readonly spellId: string;
  readonly name: string;
  readonly level: number;
  readonly sourceTypes: readonly SpellGrantSourceType[];
  readonly prepared: boolean;
  readonly alwaysPrepared: boolean;
  readonly available: boolean;
  readonly freeUsesRemaining?: number;
  readonly mayUseSpellSlots: boolean;
  readonly castingAbility: AbilityName;
}
export interface ComputedCharacter {
  readonly abilityModifiers: Readonly<
    Record<AbilityName, CalculationResult<number>>
  >;
  readonly proficiencyBonus: CalculationResult<number>;
  readonly savingThrows: Readonly<
    Record<AbilityName, CalculationResult<number>>
  >;
  readonly skills: Readonly<Record<SkillName, CalculationResult<number>>>;
  readonly initiative: CalculationResult<number>;
  readonly passivePerception: CalculationResult<number>;
  readonly armorClass: CalculationResult<number>;
  readonly maximumHp: CalculationResult<number>;
  readonly currentHp: number;
  readonly temporaryHp: number;
  readonly spellcasting?: ComputedSpellcasting;
  readonly classLevel?: {
    readonly level: number;
    readonly cantripsKnown: number;
    readonly preparedSpells: number;
    readonly maximumSpellLevel: number;
  };
  readonly activeFeatures: readonly ComputedFeature[];
  readonly activeResources: readonly ComputedResource[];
  readonly spells: readonly ComputedSpellAccess[];
  readonly spellDiagnostics: readonly SpellDiagnostic[];
  readonly ruleDiagnostics: readonly RuleDiagnostic[];
  readonly activeLandType?: LandType;
}
