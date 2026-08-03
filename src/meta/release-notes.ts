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
      'Adds the generic CharacterState overlay and a complete persistent Wild Shape gameplay mode.',
    addedFeatureIds: LATEST_ITERATION_FEATURE_IDS,
    fixes: [
      'Damage is routed through Beast HP and overflow reaches character HP after automatic reversion.',
      'The normal character sheet remains mounted while physical statistics reflect the active form.',
    ],
    knownLimitations: KNOWN_LIMITATIONS,
  },
]);
