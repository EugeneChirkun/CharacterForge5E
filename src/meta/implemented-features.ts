export type FeatureCategory =
  | 'character-management'
  | 'character-creation'
  | 'rules-engine'
  | 'druid'
  | 'species'
  | 'background'
  | 'spells'
  | 'equipment'
  | 'session'
  | 'persistence'
  | 'pwa'
  | 'accessibility'
  | 'release-quality';
export interface ImplementedFeature {
  readonly id: string;
  readonly name: string;
  readonly category: FeatureCategory;
  readonly introducedIn: string;
  readonly summary: string;
  readonly status: 'implemented' | 'partial';
}
const entries: readonly [
  string,
  string,
  FeatureCategory,
  string,
  string,
  ('implemented' | 'partial')?,
][] = [
  [
    'character-list',
    'Character list',
    'character-management',
    '2A',
    'Browse locally stored and reference characters.',
  ],
  [
    'character-actions',
    'Character actions',
    'character-management',
    '3.4',
    'Create, duplicate, delete, and export characters.',
  ],
  [
    'reference-character',
    'Reference character',
    'character-management',
    '2A',
    'A verified level-8 Druid fixture.',
  ],
  [
    'creation-methods',
    'Ability generation',
    'character-creation',
    '2C',
    'Standard Array, Point Buy, and Manual Entry.',
  ],
  [
    'origin-builder',
    'Supported origin builder',
    'character-creation',
    '2C',
    'Tiefling, Chthonic Legacy, Farmer, Tough, and skills.',
  ],
  [
    'spell-builder',
    'Spell choices',
    'character-creation',
    '2C',
    'Choose cantrips and prepared Druid spells.',
  ],
  [
    'primal-order',
    'Primal Order',
    'druid',
    '3.5A',
    'Choose Magician or Warden with structured effects.',
  ],
  [
    'starting-equipment',
    'Starting equipment and gold',
    'equipment',
    '3.5B',
    'Choose packages, gold alternatives, and creation purchases.',
  ],
  [
    'advancement',
    'Druid advancement',
    'druid',
    '3.5C',
    'Level-up and level 4/8 ASI or supported General Feat choices.',
  ],
  [
    'character-models',
    'Build, session, and computed models',
    'rules-engine',
    '2A',
    'Separates permanent, live, and derived character state.',
  ],
  [
    'derived-statistics',
    'Derived statistics',
    'rules-engine',
    '2A',
    'Calculates modifiers, proficiency, saves, skills, HP, AC, initiative, Perception, and spell statistics.',
  ],
  [
    'rule-diagnostics',
    'Rules diagnostics',
    'rules-engine',
    '2B',
    'Typed validation with human-readable presentation.',
  ],
  [
    'druid-levels',
    'Druid levels 1–9',
    'druid',
    '2B',
    'Verified progression, slots, features, and resources.',
  ],
  [
    'wild-shape',
    'Wild Shape resource',
    'druid',
    '3.5A',
    'Tracks uses and verified rest recovery.',
  ],
  [
    'tiefling-chthonic',
    'Chthonic Tiefling',
    'species',
    '2B',
    'Structured legacy features and spell grants.',
  ],
  [
    'farmer-tough',
    'Farmer and Tough',
    'background',
    '2B',
    'Supported background and origin-feat mechanics.',
  ],
  [
    'spellbook',
    'Spellbook',
    'spells',
    '3.3',
    'Search, filter, sort, group, prepare, inspect, and track spell slots.',
  ],
  [
    'inventory',
    'Structured inventory',
    'equipment',
    '3B',
    'Armor, shields, weapons, tools, focus, containers, currency, and AC integration.',
  ],
  [
    'session-mode',
    'Session Mode',
    'session',
    '3.5C',
    'Tracks HP, temporary HP, slots, resources, concentration, conditions, rests, and undo.',
  ],
  [
    'local-persistence',
    'Local persistence and migration',
    'persistence',
    '2A',
    'Versioned browser-local character records and safe migrations.',
  ],
  [
    'offline-pwa',
    'Offline PWA',
    'pwa',
    '3.4',
    'Installable application shell with controlled updates.',
  ],
  [
    'accessible-responsive-ui',
    'Responsive accessible UI',
    'accessibility',
    '2A',
    'Keyboard-friendly layouts for desktop and mobile.',
  ],
  [
    'subclass-registry',
    'Generic subclass registry',
    'rules-engine',
    '3.5D',
    'Immutable typed subclass definitions with stable IDs.',
  ],
  [
    'explicit-subclass-selection',
    'Explicit subclass selection',
    'character-creation',
    '3.5D',
    'Stores the permanent Circle choice in CharacterBuild.',
  ],
  [
    'circle-land',
    'Circle of the Land',
    'druid',
    '3.5D',
    'Structured features and all four supported lands.',
  ],
  [
    'circle-spells',
    'Circle spell resolution',
    'spells',
    '3.5D',
    'Land-gated, always-prepared grants excluded from preparation limits.',
  ],
  [
    'long-rest-land',
    'Long Rest land switching',
    'session',
    '3.5D',
    'Atomically changes active land through rest confirmation.',
  ],
  [
    'subclass-migration',
    'Subclass migration',
    'persistence',
    '3.5D',
    'Flags historical missing subclass and land choices without guessing.',
  ],
  [
    'application-footer',
    'Application footer',
    'release-quality',
    '3.5D',
    'Shows derived release and feature totals everywhere.',
  ],
  [
    'about-page',
    'About and release information',
    'release-quality',
    '3.5D',
    'Groups scope, features, releases, and limitations.',
  ],
  [
    'iteration-metadata',
    'Centralized iteration metadata',
    'release-quality',
    '3.5D',
    'One source of truth for release identity.',
  ],
  [
    'feature-registry',
    'Implemented-feature registry',
    'release-quality',
    '3.5D',
    'Auditable structured functionality catalog.',
  ],
  [
    'release-notes',
    'Structured release notes',
    'release-quality',
    '3.5D',
    'Validated latest-iteration additions and fixes.',
  ],
  [
    'smart-choice-filtering',
    'Smart choice filtering',
    'rules-engine',
    '3.5E',
    'Rules-owned visibility and legality for typed choice options.',
  ],
  [
    'equipment-capabilities',
    'Multi-capability equipment',
    'equipment',
    '3.5E',
    'One Quarterstaff definition acts as both weapon and Druidic Focus.',
  ],
  [
    'equipment-packages',
    'Structured equipment packages',
    'equipment',
    '3.5E',
    'Expandable contents, derived totals, duplicate awareness, and source-preserving materialization.',
  ],
  [
    'equipment-summaries',
    'Equipment mechanical summaries',
    'equipment',
    '3.5E',
    'Verified weapon, armor, shield, cost, weight, and proficiency details.',
  ],
  [
    'character-state',
    'Generic character state',
    'session',
    '3.5F',
    'Immutable, persistent temporary-state overlay architecture.',
  ],
  [
    'wild-shape-mode',
    'Playable Wild Shape',
    'druid',
    '3.5F',
    'Eligible Beast selection, preview, transformation, reversion, and HP routing.',
  ],
  [
    'beast-registry',
    'Verified Beast registry',
    'rules-engine',
    '3.5F',
    'Small verified registry with complete informational stat blocks.',
  ],
  [
    'active-state-card',
    'Active character state card',
    'session',
    '3.5F',
    'Generic computed-state presentation directly below the character header.',
  ],
];
export const IMPLEMENTED_FEATURES: readonly ImplementedFeature[] =
  Object.freeze(
    entries.map(
      ([id, name, category, introducedIn, summary, status = 'implemented']) =>
        Object.freeze({ id, name, category, introducedIn, summary, status }),
    ),
  );
export const LATEST_ITERATION_FEATURE_IDS = Object.freeze(
  IMPLEMENTED_FEATURES.filter((feature) => feature.introducedIn === '3.5F').map(
    (feature) => feature.id,
  ),
);
export const FEATURE_CATEGORY_LABELS: Readonly<
  Record<FeatureCategory, string>
> = Object.freeze({
  'character-management': 'Character Management',
  'character-creation': 'Character Creation',
  'rules-engine': 'Rules Engine',
  druid: 'Druid',
  species: 'Species',
  background: 'Background',
  spells: 'Spellbook',
  equipment: 'Equipment',
  session: 'Session',
  persistence: 'Persistence',
  pwa: 'PWA',
  accessibility: 'Accessibility',
  'release-quality': 'Release Quality',
});
