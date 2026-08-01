import type { CharacterBuild } from '../character';
import {
  generalFeatRegistry,
  unavailableGeneralFeatCatalog,
} from './feat-registry';
import type {
  FeatureCapabilityId,
  GeneralFeatDefinition,
} from './feat-definition';

export type FeatAvailability =
  | { readonly status: 'available' }
  | {
      readonly status: 'unavailable';
      readonly reasonCode:
        | 'prerequisite-not-met'
        | 'capability-not-implemented'
        | 'already-selected'
        | 'not-repeatable'
        | 'rule-content-not-installed';
      readonly message: string;
    };
export const implementedFeatCapabilities: readonly FeatureCapabilityId[] = [
  'ability-score-increase',
  'saving-throw-proficiency',
  'skill-proficiency',
  'skill-expertise',
  'maximum-hit-points',
];

/** Resolves ownership without knowing whether it came from a background or advancement. */
export function resolveOwnedFeatIds(build: CharacterBuild): readonly string[] {
  return [...new Set([...(build.featIds ?? []), ...(build.feats ?? [])])];
}
export function evaluateFeatAvailability(
  feat: GeneralFeatDefinition,
  build: CharacterBuild,
  level: number,
): FeatAvailability {
  if (level < feat.minimumLevel)
    return {
      status: 'unavailable',
      reasonCode: 'prerequisite-not-met',
      message: `Requires level ${feat.minimumLevel}.`,
    };
  const missing = feat.requiredCapabilities.find(
    (id) => !implementedFeatCapabilities.includes(id),
  );
  if (missing)
    return {
      status: 'unavailable',
      reasonCode: 'capability-not-implemented',
      message: `${missing.replaceAll('-', ' ')} is not implemented in the current rules package.`,
    };
  if (!feat.repeatable && resolveOwnedFeatIds(build).includes(feat.id)) {
    const backgroundOwned =
      build.backgroundId && build.featIds?.includes(feat.id);
    return {
      status: 'unavailable',
      reasonCode: 'not-repeatable',
      message: backgroundOwned
        ? `Already granted by the ${build.backgroundId[0].toUpperCase() + build.backgroundId.slice(1)} background and cannot be selected again.`
        : 'Already selected and cannot be selected again.',
    };
  }
  return { status: 'available' };
}
export function listGeneralFeatAvailability(
  build: CharacterBuild,
  level: number,
) {
  const installed = Object.values(generalFeatRegistry).map((definition) => ({
    definition,
    availability: evaluateFeatAvailability(definition, build, level),
  }));
  const deferred = unavailableGeneralFeatCatalog.map((definition) => ({
    definition,
    availability: {
      status: 'unavailable',
      reasonCode: 'capability-not-implemented',
      message: definition.summary,
    } as const,
  }));
  return [...installed, ...deferred].sort((a, b) =>
    a.definition.name.localeCompare(b.definition.name),
  );
}
