import type { RuleSource } from '../rules';
export type CircleLandId = 'arid' | 'polar' | 'temperate' | 'tropical';
export interface SubclassProgressionEntry {
  readonly level: number;
  readonly featureIds: readonly string[];
}
export interface SubclassDefinition {
  readonly id: string;
  readonly legacyIds: readonly string[];
  readonly classId: string;
  readonly name: string;
  readonly selectionLevel: number;
  readonly progression: readonly SubclassProgressionEntry[];
  readonly landIds: readonly CircleLandId[];
  readonly source: RuleSource;
  readonly verified: boolean;
}
export interface SubclassRegistry {
  readonly byId: Readonly<Record<string, SubclassDefinition>>;
}
export interface LandTypeDefinition {
  readonly id: CircleLandId;
  readonly name: string;
  readonly summary: string;
  readonly spellGrantIds: readonly string[];
  readonly source: RuleSource;
}
export type SubclassDiagnosticCode =
  | 'missing-required-subclass'
  | 'invalid-subclass'
  | 'subclass-not-installed'
  | 'subclass-class-mismatch'
  | 'subclass-selected-too-early'
  | 'duplicate-subclass-choice'
  | 'missing-circle-land'
  | 'invalid-circle-land'
  | 'circle-land-not-available'
  | 'corrupt-subclass-state';
