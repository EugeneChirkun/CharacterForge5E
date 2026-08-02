import { phb2024 } from '../rules/registry';
import type { LandTypeDefinition, SubclassDefinition, SubclassRegistry } from './subclass-definition';
export const CIRCLE_OF_THE_LAND_ID = 'circle-of-the-land';
export const circleOfTheLand: SubclassDefinition = Object.freeze({
  id: CIRCLE_OF_THE_LAND_ID,
  legacyIds: ['druid.circle-of-the-land', 'Circle of the Land'],
  classId: 'druid',
  name: 'Circle of the Land',
  selectionLevel: 3,
  progression: Object.freeze([
    { level: 3, featureIds: ['land-circle-spells', 'land-natures-aid'] },
    { level: 6, featureIds: ['land-natural-recovery'] },
  ]),
  landIds: Object.freeze(['arid', 'polar', 'temperate', 'tropical'] as const),
  source: phb2024,
  verified: true,
});
export const subclassRegistry: Readonly<Record<string, SubclassDefinition>> =
  Object.freeze({ [CIRCLE_OF_THE_LAND_ID]: circleOfTheLand });
export const installedSubclassRegistry: SubclassRegistry = Object.freeze({
  byId: subclassRegistry,
});

const landSummary = {
  arid: 'Magic adapted to dry, sun-baked regions.',
  polar: 'Magic adapted to frozen and wintry regions.',
  temperate: 'Magic adapted to mild forests and grasslands.',
  tropical: 'Magic adapted to warm, lush regions.',
} as const;
const landSpellIds = {
  arid: ['fire-bolt', 'burning-hands', 'blur', 'fireball', 'blight'],
  polar: ['ray-of-frost', 'fog-cloud', 'hold-person', 'sleet-storm', 'ice-storm'],
  temperate: ['shocking-grasp', 'sleep', 'misty-step', 'lightning-bolt', 'freedom-of-movement'],
  tropical: ['acid-splash', 'ray-of-sickness', 'web', 'stinking-cloud', 'polymorph'],
} as const;
export const landTypeRegistry: Readonly<Record<string, LandTypeDefinition>> =
  Object.freeze(Object.fromEntries(circleOfTheLand.landIds.map((id) => [id, Object.freeze({
    id,
    name: id[0].toUpperCase() + id.slice(1),
    summary: landSummary[id],
    spellGrantIds: Object.freeze(landSpellIds[id].map((spellId) => `land-${id}-${spellId}`)),
    source: phb2024,
  })])));
export function normalizeSubclassId(value: unknown): string | undefined {
  return typeof value === 'string' &&
    (value === circleOfTheLand.id || circleOfTheLand.legacyIds.includes(value))
    ? circleOfTheLand.id
    : undefined;
}
export function toRulesSubclassId(
  value: string | undefined,
): string | undefined {
  return normalizeSubclassId(value) ? 'circle-of-the-land' : value;
}
