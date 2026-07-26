import type { CharacterViewModel } from '../../features/characters/character.types';
import { defaultRuleRegistry, type RuleRegistry } from '../../domain/rules';
import {
  filterSpells,
  groupSpells,
  searchSpells,
  sortSpellbookSpells,
  type SpellbookQuery,
  type SpellbookView,
  type SpellCardView,
} from '../../domain/spells';

const componentLabels = (spell: RuleRegistry['spells'][string]) => [
  ...(spell.components.verbal ? ['Verbal'] : []),
  ...(spell.components.somatic ? ['Somatic'] : []),
  ...(spell.components.material ? ['Material'] : []),
];

export function selectSpellCards(
  character: CharacterViewModel,
  registry: RuleRegistry = defaultRuleRegistry,
): readonly SpellCardView[] {
  const access = new Map(character.spells.map((spell) => [spell.id, spell]));
  const maximumLevel = Math.max(
    0,
    ...character.spellSlots.map((slot) => slot.level),
  );
  const prepared = new Set(character.preparedSpellIds ?? []);
  return Object.values(registry.spells)
    .filter((spell) => spell.source.verified)
    .map((spell) => {
      const current = access.get(spell.id);
      const classAccessible =
        spell.classIds.includes('druid') && spell.level <= maximumLevel;
      const sources =
        current?.sources ??
        (spell.classIds.includes('druid') ? (['class'] as const) : []);
      const alwaysPrepared = current?.alwaysPrepared ?? false;
      const granted = sources.some((source) => source !== 'class');
      const isPrepared =
        spell.level === 0
          ? !!current
          : prepared.has(spell.id) || alwaysPrepared;
      return {
        id: spell.id,
        name: spell.name,
        level: spell.level,
        school: spell.school,
        sources,
        prepared: isPrepared,
        alwaysPrepared,
        granted,
        available: classAccessible || !!current,
        ritual: spell.ritual,
        concentration: spell.concentration,
        castingTime: spell.castingTime,
        range: spell.range,
        duration: spell.duration,
        components: componentLabels(spell),
        materialRequirement: spell.components.materialRequirement,
        tags: spell.tags,
        canTogglePreparation:
          spell.level > 0 && classAccessible && !alwaysPrepared && !granted,
      };
    });
}

export function selectSpellbook(
  character: CharacterViewModel,
  query: SpellbookQuery,
  selectedId?: string,
  registry: RuleRegistry = defaultRuleRegistry,
): SpellbookView {
  const all = selectSpellCards(character, registry);
  const visible = sortSpellbookSpells(
    filterSpells(searchSpells(all, query.search), query.filters),
    query.sort,
  );
  const prepared = all.filter(
    (spell) =>
      spell.prepared &&
      spell.level > 0 &&
      !spell.alwaysPrepared &&
      !spell.granted,
  );
  const progression = registry.classes.druid.progression.find(
    (row) => row.level === character.level,
  );
  return {
    groups: groupSpells(visible),
    resultCount: visible.length,
    slots: character.spellSlots.map((slot) => ({
      level: slot.level,
      remaining: slot.current,
      maximum: slot.maximum,
      canSpend: slot.current > 0,
      canRestore: slot.current < slot.maximum,
    })),
    preparedCount: prepared.length,
    preparedLimit: progression?.preparedSpells ?? 0,
    alwaysPreparedCount: all.filter((spell) => spell.alwaysPrepared).length,
    grantedCount: all.filter((spell) => spell.granted).length,
    diagnostics: (character.diagnosticGroups?.spellPreparation ?? []).map(
      (code) => spellPreparationDiagnosticMessage(code),
    ),
    selected: all.find((spell) => spell.id === selectedId),
  };
}

function spellPreparationDiagnosticMessage(code: string): string {
  const messages: Readonly<Record<string, string>> = {
    'too-many-prepared-spells': 'Too many Druid spells are prepared.',
    'inaccessible-spell-level': 'A prepared spell is above the maximum spell level.',
    'not-on-class-list': 'A prepared spell is not on the Druid spell list.',
    'duplicate-spell-selection': 'A prepared spell was selected more than once.',
    'missing-spell-definition': 'A prepared spell is no longer available in these rules.',
    'cantrip-in-prepared-spells': 'Cantrips do not use prepared spell selections.',
    'granted-spell-counted-as-class': 'A granted spell does not count against the preparation limit.',
  };
  return messages[code] ?? 'A spell preparation choice needs attention.';
}
