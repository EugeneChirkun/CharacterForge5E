import type { RuleRegistry, SpellDefinition } from '../rules';

export interface SpellSortItem {
  readonly id: string;
  readonly name: string;
  readonly level: number;
}

/** The canonical ordering for every resolved or selectable spell list. */
export function compareSpells(a: SpellSortItem, b: SpellSortItem): number {
  const level = a.level - b.level;
  if (level !== 0) return level;

  const name = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  if (name !== 0) return name;

  return a.id.localeCompare(b.id, 'en');
}

export function sortSpells<T extends SpellSortItem>(
  spells: readonly T[],
): readonly T[] {
  return [...spells].sort(compareSpells);
}

export function getAvailableClassSpells(input: {
  readonly classId: string;
  readonly characterLevel: number;
  readonly registry: RuleRegistry;
}): readonly SpellDefinition[] {
  const classRule = input.registry.classes[input.classId];
  const progression = classRule?.progression.find(
    (entry) => entry.level === input.characterLevel,
  );
  if (!classRule?.source.verified || !progression) return [];

  const maximumLevel = Math.max(
    0,
    ...Object.keys(progression.spellSlots).map(Number),
  );
  return sortSpells(
    Object.values(input.registry.spells).filter(
      (spell) =>
        spell.source.verified &&
        spell.source.ruleset === classRule.source.ruleset &&
        spell.classIds.includes(input.classId) &&
        spell.level <= maximumLevel,
    ),
  );
}

export function getAvailableClassCantrips(input: {
  readonly classId: string;
  readonly characterLevel: number;
  readonly registry: RuleRegistry;
}): readonly SpellDefinition[] {
  return getAvailableClassSpells(input).filter((spell) => spell.level === 0);
}
