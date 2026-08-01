import type { RuleRegistry, SpellDefinition } from '../rules';
import type { CircleLandId } from './subclass-definition';

export interface CircleSpellGrantView {
  readonly spell: SpellDefinition;
  readonly source: {
    readonly type: 'subclass';
    readonly name: 'Circle of the Land';
    readonly landId: CircleLandId;
  };
  readonly alwaysPrepared: true;
  readonly countsAgainstPreparedLimit: false;
}
export function resolveCircleSpells(
  registry: RuleRegistry,
  level: number,
  landId: CircleLandId,
): readonly CircleSpellGrantView[] {
  const seen = new Set<string>();
  return Object.values(registry.spellGrants)
    .filter(
      (grant) =>
        grant.sourceType === 'subclass' &&
        grant.sourceId === 'circle-of-the-land' &&
        grant.landType === landId &&
        grant.unlockedAtCharacterLevel <= level,
    )
    .sort((a, b) => a.spellId.localeCompare(b.spellId))
    .flatMap((grant) => {
      const spell = registry.spells[grant.spellId];
      if (!spell || seen.has(spell.id)) return [];
      seen.add(spell.id);
      return [
        {
          spell,
          source: {
            type: 'subclass' as const,
            name: 'Circle of the Land' as const,
            landId,
          },
          alwaysPrepared: true as const,
          countsAgainstPreparedLimit: false as const,
        },
      ];
    });
}
export function previewCircleLandTransition(
  registry: RuleRegistry,
  level: number,
  before: CircleLandId,
  after: CircleLandId,
) {
  const oldSpells = resolveCircleSpells(registry, level, before);
  const newSpells = resolveCircleSpells(registry, level, after);
  return {
    label:
      before === after
        ? `Circle Land remains ${title(before)}`
        : `${title(before)} → ${title(after)}`,
    removed: oldSpells.filter(
      (old) => !newSpells.some((next) => next.spell.id === old.spell.id),
    ),
    granted: newSpells.filter(
      (next) => !oldSpells.some((old) => old.spell.id === next.spell.id),
    ),
  };
}
const title = (value: string) => value[0].toUpperCase() + value.slice(1);
