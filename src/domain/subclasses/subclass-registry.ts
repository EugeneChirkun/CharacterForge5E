import { phb2024 } from '../rules/registry';
import type { SubclassDefinition } from './subclass-definition';
export const CIRCLE_OF_THE_LAND_ID = 'druid.circle-of-the-land';
export const circleOfTheLand: SubclassDefinition = Object.freeze({
  id: CIRCLE_OF_THE_LAND_ID,
  legacyIds: ['circle-of-the-land', 'Circle of the Land'],
  classId: 'druid',
  name: 'Circle of the Land',
  selectionLevel: 3,
  progression: Object.freeze([
    { level: 3, featureIds: ['land-circle-spells', 'land-natures-aid'] },
    { level: 6, featureIds: ['land-natural-recovery'] },
  ]),
  landIds: Object.freeze(['arid', 'polar', 'temperate', 'tropical'] as const),
  source: phb2024,
});
export const subclassRegistry: Readonly<Record<string, SubclassDefinition>> =
  Object.freeze({ [CIRCLE_OF_THE_LAND_ID]: circleOfTheLand });
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
