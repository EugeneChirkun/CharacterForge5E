import { LATEST_ITERATION_FEATURE_IDS } from './implemented-features';
import { KNOWN_LIMITATIONS } from './known-limitations';
import { CURRENT_ITERATION } from './iteration-metadata';
export interface IterationReleaseNote {
  readonly iterationId: string;
  readonly title: string;
  readonly summary: string;
  readonly addedFeatureIds: readonly string[];
  readonly fixes: readonly string[];
  readonly knownLimitations: readonly string[];
}
export const RELEASE_NOTES: readonly IterationReleaseNote[] = Object.freeze([
  {
    iterationId: CURRENT_ITERATION.id,
    title: CURRENT_ITERATION.name,
    summary:
      'Completes rules-owned choice filtering and the structured equipment, focus, package, and inventory experience.',
    addedFeatureIds: LATEST_ITERATION_FEATURE_IDS,
    fixes: [
      'Illegal Skill Expert options are filtered and stale selections are cleared.',
      'Explorer’s Pack materializes into sourced inventory items without duplicating Quarterstaff.',
    ],
    knownLimitations: KNOWN_LIMITATIONS,
  },
]);
