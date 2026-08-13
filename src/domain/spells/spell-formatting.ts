import type { DiceExpression, SpellCastingTime, SpellDuration, SpellRange } from '../rules';

export function formatCastingTime(value: SpellCastingTime): string {
  if (value.type === 'action') return 'Action';
  if (value.type === 'bonus-action') return 'Bonus Action';
  if (value.type === 'reaction') return `Reaction${value.trigger ? ` — ${value.trigger}` : ''}`;
  if (value.type === 'minute' || value.type === 'hour')
    return `${value.amount} ${value.type}${value.amount === 1 ? '' : 's'}`;
  return value.label;
}
export function formatSpellRange(value: SpellRange): string {
  if (value.type === 'distance') return `${value.feet} feet`;
  if (value.type === 'special') return value.label;
  return value.type[0].toUpperCase() + value.type.slice(1);
}
export function formatSpellDuration(value: SpellDuration): string {
  if (value.type === 'instantaneous') return 'Instantaneous';
  if (value.type === 'until-dispelled') return 'Until dispelled';
  if (value.type === 'special') return value.label;
  const unit = value.type === 'rounds' ? 'round' : value.type.slice(0, -1);
  return `${value.concentration ? 'Concentration, up to ' : ''}${value.amount} ${unit}${value.amount === 1 ? '' : 's'}`;
}
export function formatDiceExpression(value: DiceExpression): string {
  const fixed = value.modifier ? ` ${value.modifier > 0 ? '+' : '-'} ${Math.abs(value.modifier)}` : '';
  const ability = value.modifierType === 'spellcasting-ability' ? ' + Spellcasting Ability Modifier' : '';
  return `${value.count}d${value.die}${fixed}${ability}`;
}
export function averageDiceExpression(value: DiceExpression, abilityModifier = 0): number {
  return value.count * ((value.die + 1) / 2) + (value.modifier ?? 0) +
    (value.modifierType === 'spellcasting-ability' ? abilityModifier : 0);
}
