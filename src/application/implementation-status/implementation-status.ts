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
  iteration: '3.5C',
  title: 'Druid Level Advancement, ASI, General Feats and Session Corrections',
  summary:
    'Ability Score Improvements, General Feat selection, advancement preview, Conditions redesign, condition recovery, session Maximum HP adjustments, and improved Session Mode.',
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
    'General Feats',
    'Conditions redesign',
    'Maximum HP adjustment',
  ]),
} as const satisfies ApplicationImplementationStatus);
