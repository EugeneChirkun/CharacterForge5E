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
  iteration: '3.5D',
  title: 'Druid Subclass, Circle of the Land and General Feat Completion',
  summary:
    'Generic General Feat registry, supported feat selection, prerequisite diagnostics, Druid subclass selection, Circle of the Land progression, Long Rest land changes, and Circle spell integration.',
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
  ]),
} as const satisfies ApplicationImplementationStatus);
