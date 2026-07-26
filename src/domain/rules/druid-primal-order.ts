import type { CharacterBuild } from '../character';
import type { CalculationResult } from '../calculation';
import type { RuleRegistry, DruidPrimalOrderSelection } from './models';

export type PrimalOrderDiagnostic =
  | 'missing-primal-order' | 'invalid-primal-order'
  | 'missing-magician-cantrip' | 'invalid-magician-cantrip'
  | 'missing-magician-skill-choice' | 'stale-primal-order-choice'
  | 'duplicate-cantrip-selection';

export type SelectedCantripSource =
  | 'druid-base'
  | 'primal-order-magician'
  | 'species'
  | 'subclass'
  | 'feat';
export interface SelectedCantrip {
  readonly spellId: string;
  readonly source: SelectedCantripSource;
}

/** The single source of truth for character-build cantrip ownership. */
export function getResolvedCantripSelections(
  build: Pick<CharacterBuild, 'cantripIds' | 'class'>,
): readonly SelectedCantrip[] {
  const selected: SelectedCantrip[] = (build.cantripIds ?? []).map((spellId) => ({
    spellId,
    source: 'druid-base',
  }));
  const order = build.class?.primalOrder;
  const magicianId = order?.orderId === 'magician'
    ? order.magicianChoices?.additionalCantripId
    : undefined;
  if (magicianId && !selected.some((choice) => choice.spellId === magicianId))
    selected.push({ spellId: magicianId, source: 'primal-order-magician' });
  return selected;
}

export function getCantripSelectionDiagnostics(
  build: Pick<CharacterBuild, 'cantripIds' | 'class'>,
): readonly PrimalOrderDiagnostic[] {
  const order = build.class?.primalOrder;
  const magicianId = order?.orderId === 'magician'
    ? order.magicianChoices?.additionalCantripId
    : undefined;
  return magicianId && (build.cantripIds ?? []).includes(magicianId)
    ? ['duplicate-cantrip-selection']
    : [];
}

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
  else if (!spell || spell.level !== 0 || !spell.classIds.includes('druid')) out.push('invalid-magician-cantrip');
  else if (normalCantrips.includes(spell.id)) out.push('duplicate-cantrip-selection');
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
