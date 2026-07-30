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
  iteration: '3.5B',
  title: 'Druid Starting Equipment, Gold Alternatives and Purchasing',
  summary:
    'Druid and Farmer starting equipment packages, gold alternatives, structured purchasing during character creation, inventory materialization, Armor Class integration, and migration support.',
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
    'Starting equipment packages',
    'Starting gold alternatives',
    'Character creation purchasing',
  ]),
} as const satisfies ApplicationImplementationStatus);
