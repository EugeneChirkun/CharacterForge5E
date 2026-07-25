import type { ResourceDefinition, RuleRegistry } from '../rules';
export interface ComputedResource {
  readonly id: string;
  readonly name: string;
  readonly maximum: number;
  readonly remaining: number;
  readonly recovery: readonly ('short' | 'long')[];
}
export function resourceMaximum(
  definition: ResourceDefinition,
  classLevel: number,
): number {
  if (definition.maximum.type === 'constant') return definition.maximum.value;
  return definition.maximum.values[classLevel] ?? 0;
}
export function resolveResources(
  registry: RuleRegistry,
  level: number,
  state: Readonly<Record<string, number>>,
  activeOwnerIds: readonly string[],
): { resources: readonly ComputedResource[]; invalid: readonly string[] } {
  const invalid: string[] = [];
  const resources = Object.values(registry.resources)
    .filter(
      (r) => r.minimumLevel <= level && activeOwnerIds.includes(r.ownerId),
    )
    .map((r) => {
      const maximum = resourceMaximum(r, level);
      const remaining = state[r.id] ?? maximum;
      if (!Number.isInteger(remaining) || remaining < 0 || remaining > maximum)
        invalid.push(r.id);
      return {
        id: r.id,
        name: r.name,
        maximum,
        remaining,
        recovery: r.recovery.map((x) => x.restType),
      };
    });
  return { resources, invalid };
}
export function spendResource(
  state: Readonly<Record<string, number>>,
  resourceId: string,
  amount = 1,
): Readonly<Record<string, number>> {
  const current = state[resourceId];
  if (
    current === undefined ||
    !Number.isInteger(amount) ||
    amount < 1 ||
    current < amount
  )
    throw new RangeError(`Cannot spend ${amount} from ${resourceId}`);
  return { ...state, [resourceId]: current - amount };
}
