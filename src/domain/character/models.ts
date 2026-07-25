import type { AbilityName, AbilityScores } from '../abilities';
import type { ArmorClassSource } from '../armor-class';
import type { CalculationResult } from '../calculation';
import type { HitPointProgression } from '../hit-points';
import type { SkillName } from '../skills';
import type { ComputedSpellcasting, SpellcastingBuild } from '../spellcasting';
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
}
export interface CharacterSession {
  readonly currentHp: number;
  readonly temporaryHp: number;
  readonly spentHitDice: number;
  readonly spentSpellSlots: Readonly<Record<number, number>>;
  readonly resources: Readonly<Record<string, number>>;
  readonly conditions: readonly string[];
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
}
