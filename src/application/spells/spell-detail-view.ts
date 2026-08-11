import type { ContentCompleteness, DiceExpression, SpellDefinition } from '../../domain/rules';

export interface ResolvedSpellSource {
  readonly type: 'class' | 'subclass' | 'species' | 'primal-order' | 'feat';
  readonly sourceId: string;
  readonly label: string;
}
export interface SpellDetailView {
  readonly id: string; readonly name: string; readonly level: number;
  readonly levelLabel: string; readonly schoolLabel: string;
  readonly castingTimeLabel: string; readonly rangeLabel: string;
  readonly componentsLabel: string; readonly materialComponentText?: string;
  readonly durationLabel: string; readonly concentration: boolean; readonly ritual: boolean;
  readonly attackOrSaveLabel?: string; readonly damageSummary?: string;
  readonly healingSummary?: string; readonly scalingSummary?: string;
  readonly description: string; readonly higherLevels?: string;
  readonly sourceLabel: string; readonly completeness: ContentCompleteness;
  readonly sources: readonly ResolvedSpellSource[];
}
const dice = (value: DiceExpression) => `${value.count}d${value.die}${value.modifier ? `${value.modifier > 0 ? '+' : ''}${value.modifier}` : ''}`;
const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replaceAll('-', ' ');

export function createSpellDetailView(
  spell: SpellDefinition,
  sources: readonly ResolvedSpellSource[] = [{ type: 'class', sourceId: 'druid', label: 'Druid' }],
): SpellDetailView {
  const componentCodes = [spell.components.verbal && 'V', spell.components.somatic && 'S', spell.components.material && 'M'].filter(Boolean);
  const attackOrSaveLabel = spell.attackType
    ? `${title(spell.attackType)} Attack`
    : spell.savingThrow ? `${spell.savingThrow.toUpperCase()} Save` : undefined;
  return {
    id: spell.id, name: spell.name, level: spell.level,
    levelLabel: spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`,
    schoolLabel: title(spell.school), castingTimeLabel: spell.castingTime,
    rangeLabel: spell.range, componentsLabel: componentCodes.join('/'),
    materialComponentText: spell.components.materialRequirement,
    durationLabel: spell.duration, concentration: spell.concentration, ritual: spell.ritual,
    attackOrSaveLabel,
    damageSummary: spell.damage?.map((d) => `${dice(d.dice)} ${title(d.damageType)}`).join(', '),
    healingSummary: spell.healing?.map((h) => `${dice(h.dice)}${h.abilityModifier ? ` + ${title(h.abilityModifier)} modifier` : ''}`).join(', '),
    scalingSummary: spell.scaling?.steps.map((s) => `Level ${s.minimumLevel}: ${dice(s.dice)}`).join(' • '),
    description: spell.description, higherLevels: spell.higherLevels,
    sourceLabel: sources.map((source) => source.label).join(', ') || 'Bundled content',
    completeness: spell.content.completeness, sources,
  };
}
