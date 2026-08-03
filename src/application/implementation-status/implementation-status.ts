export interface ApplicationImplementationStatus {
  readonly stage: string;
  readonly iteration: string;
  readonly title: string;
  readonly summary: string;
  readonly implementedFeatures: readonly string[];
}

/** The single application-facing source for the currently implemented milestone. */
export const applicationImplementationStatus = Object.freeze({
  stage: '3',
  iteration: CURRENT_ITERATION.id,
  title: 'Character State System and Wild Shape',
  summary:
    'Generic persistent CharacterState overlays, verified Wild Shape forms, transformation preview, Beast HP routing, reversion, and Beast details on the normal Druid sheet.',
  implementedFeatures: Object.freeze([
    'Generic rules engine',
    'Character creation',
    'Druid levels 1–8',
    'Circle of the Land',
    'Tiefling (Chthonic)',
    'Farmer',
    'Tough',
    'Primal Order',
    'Wild Shape recovery',
    'Equipment & Inventory',
    'Spellbook',
    'Session Mode',
    'Starting equipment',
    'Character creation purchasing',
    'Ability Score Improvement',
    'General Feat registry',
    'Feat availability diagnostics',
    'Supported General Feats',
    'Druid subclass selection',
    'Circle of the Land progression',
    'Circle Land Long Rest selection',
    'Circle spell recalculation',
    'Conditions redesign',
    'Maximum HP adjustment',
    'Generic Character State',
    'Playable Wild Shape',
  ]),
} as const satisfies ApplicationImplementationStatus);
import { CURRENT_ITERATION } from '../../meta';
