import type {
  ContentCompleteness,
  DiceExpression,
  SpellDefinition,
} from '../../domain/rules';

export interface ResolvedSpellSource {
  readonly type: 'class' | 'subclass' | 'species' | 'primal-order' | 'feat';
  readonly sourceId: string;
  readonly label: string;
}
export interface SpellDetailView {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly levelLabel: string;
  readonly schoolLabel: string;
  readonly castingTimeLabel: string;
  readonly rangeLabel: string;
  readonly componentsLabel: string;
  readonly materialComponentText?: string;
  readonly durationLabel: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
  readonly attackOrSaveLabel?: string;
  readonly damageSummary?: string;
  readonly healingSummary?: string;
  readonly scalingSummary?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly higherLevels?: string;
  readonly sourceLabel: string;
  readonly completeness: ContentCompleteness;
  readonly areaLabel?: string;
  readonly effectLabels: readonly string[];
  readonly sources: readonly ResolvedSpellSource[];
}
export interface SpellCompactSummaryView {
  readonly actionLabel: string;
  readonly rangeLabel: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
  readonly attackOrSaveLabel?: string;
  readonly damageLabels: readonly string[];
  readonly healingLabels: readonly string[];
  readonly areaLabel?: string;
  readonly effectLabels: readonly string[];
}
const dice = (value: DiceExpression) =>
  `${value.count}d${value.die}${value.modifier ? `${value.modifier > 0 ? '+' : ''}${value.modifier}` : ''}${value.modifierType === 'spellcasting-ability' ? ' + spellcasting ability' : ''}`;
const title = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replaceAll('-', ' ');

export function createSpellDetailView(
  spell: SpellDefinition,
  sources: readonly ResolvedSpellSource[] = [
    { type: 'class', sourceId: 'druid', label: 'Druid' },
  ],
  characterLevel = 1,
): SpellDetailView {
  const componentCodes = [
    spell.components.verbal && 'V',
    spell.components.somatic && 'S',
    spell.components.material && 'M',
  ].filter(Boolean);
  const attackOrSaveLabel = spell.attackType
    ? `${title(spell.attackType)} Attack`
    : spell.savingThrow
      ? `${spell.savingThrow.toUpperCase()} Save`
      : undefined;
  const currentScaling = spell.scaling?.steps
    .filter((step) => step.minimumLevel <= characterLevel)
    .at(-1)?.dice;
  const damage =
    spell.damage?.map(
      (d) => `${dice(currentScaling ?? d.dice)} ${title(d.damageType)}`,
    ) ?? [];
  const healing = spell.healing?.map((h) => dice(h.dice)) ?? [];
  const areaLabel = spell.area
    ? `${spell.area.sizeFeet}-ft ${spell.area.shape}`
    : undefined;
  return {
    id: spell.id,
    name: spell.name,
    level: spell.level,
    levelLabel: spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`,
    schoolLabel: title(spell.school),
    castingTimeLabel: spell.castingTime ?? 'Not available in installed content',
    rangeLabel: spell.range ?? 'Not available in installed content',
    componentsLabel: componentCodes.join('/'),
    materialComponentText: spell.components.materialRequirement,
    durationLabel: spell.duration ?? 'Not available in installed content',
    concentration: spell.concentration,
    ritual: spell.ritual,
    attackOrSaveLabel,
    damageSummary: damage.join(', ') || undefined,
    healingSummary: healing.join(', ') || undefined,
    scalingSummary: spell.scaling?.steps
      .map((s) => `Level ${s.minimumLevel}: ${dice(s.dice)}`)
      .join(' • '),
    summary: spell.summary,
    description: spell.description,
    higherLevels: spell.higherLevels,
    sourceLabel:
      spell.source.sourceId === 'phb-2024-private'
        ? 'PHB 2024'
        : spell.content.source,
    completeness: spell.content.completeness,
    areaLabel,
    effectLabels: (spell.effects ?? [])
      .slice(0, 2)
      .map((effect) => effect.shortText),
    sources,
  };
}

export function createSpellCompactSummaryView(
  spell: SpellDefinition,
  characterLevel = 1,
): SpellCompactSummaryView {
  const detail = createSpellDetailView(spell, undefined, characterLevel);
  return {
    actionLabel: detail.castingTimeLabel,
    rangeLabel: detail.rangeLabel,
    concentration: detail.concentration,
    ritual: detail.ritual,
    attackOrSaveLabel: detail.attackOrSaveLabel,
    damageLabels: detail.damageSummary ? [detail.damageSummary] : [],
    healingLabels: detail.healingSummary ? [detail.healingSummary] : [],
    areaLabel: detail.areaLabel,
    effectLabels: detail.effectLabels,
  };
}
