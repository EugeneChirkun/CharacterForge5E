import type { CharacterBuild } from '../character';
import type { CalculationResult } from '../calculation';
import type { RuleRegistry, DruidPrimalOrderSelection } from './models';

export type PrimalOrderDiagnostic =
  | 'missing-primal-order' | 'invalid-primal-order'
  | 'missing-magician-cantrip' | 'invalid-magician-cantrip'
  | 'missing-magician-skill-choice' | 'stale-primal-order-choice';

export function validateDruidPrimalOrder(
  selection: DruidPrimalOrderSelection | undefined,
  normalCantrips: readonly string[],
  registry: RuleRegistry,
): readonly PrimalOrderDiagnostic[] {
  if (!selection) return ['missing-primal-order'];
  if (!registry.druidPrimalOrders[selection.orderId]) return ['invalid-primal-order'];
  if (selection.orderId === 'warden')
    return selection.magicianChoices ? ['stale-primal-order-choice'] : [];
  const choices = selection.magicianChoices;
  if (!choices) return ['missing-magician-cantrip', 'missing-magician-skill-choice'];
  const spell = registry.spells[choices.additionalCantripId];
  const out: PrimalOrderDiagnostic[] = [];
  if (!choices.additionalCantripId) out.push('missing-magician-cantrip');
  else if (!spell || spell.level !== 0 || !spell.classIds.includes('druid') || normalCantrips.includes(spell.id)) out.push('invalid-magician-cantrip');
  if (!['arcana', 'nature'].includes(choices.skillBonusTarget)) out.push('missing-magician-skill-choice');
  return out;
}

export function applyMagicianSkillBonus(
  base: CalculationResult<number>, wisdomModifier: number,
): CalculationResult<number> {
  const amount = Math.max(1, wisdomModifier);
  return { value: base.value + amount, steps: [...base.steps, { label: 'Magician Primal Order bonus', value: amount, source: 'druid.primal-order.magician' }] };
}

export function resolvePrimalOrder(build: CharacterBuild, registry: RuleRegistry) {
  const selection = build.class?.primalOrder;
  const diagnostics = validateDruidPrimalOrder(selection, build.cantripIds ?? [], registry);
  return { selection: diagnostics.length ? undefined : selection, diagnostics };
}
