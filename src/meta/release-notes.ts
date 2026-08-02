import { LATEST_ITERATION_FEATURE_IDS } from './implemented-features';
import { KNOWN_LIMITATIONS } from './known-limitations';
import { CURRENT_ITERATION } from './iteration-metadata';
export interface IterationReleaseNote { readonly iterationId: string; readonly title: string; readonly summary: string; readonly addedFeatureIds: readonly string[]; readonly fixes: readonly string[]; readonly knownLimitations: readonly string[] }
export const RELEASE_NOTES: readonly IterationReleaseNote[] = Object.freeze([{ iterationId: CURRENT_ITERATION.id, title: CURRENT_ITERATION.name, summary: 'Completes explicit Circle of the Land choices and adds transparent application release information.', addedFeatureIds: LATEST_ITERATION_FEATURE_IDS, fixes: ['Existing high-level Druids no longer receive an inferred land choice.', 'Circle grants remain separate from the normal prepared-spell allowance.'], knownLimitations: KNOWN_LIMITATIONS }]);

