import {
  abilityNames,
  type AbilityName,
  type AbilityScores,
} from '../abilities';

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_COSTS: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};
export type AbilityGenerationMethod = 'standard-array' | 'point-buy' | 'manual';
export type AbilityAssignment = Partial<Readonly<Record<AbilityName, number>>>;
export type AbilityDiagnostic = {
  readonly type:
    | 'incomplete-standard-array'
    | 'duplicate-standard-array-value'
    | 'invalid-standard-array-value'
    | 'invalid-point-buy-score'
    | 'point-buy-budget-exceeded'
    | 'point-buy-budget-unspent'
    | 'invalid-manual-score';
  readonly ability?: AbilityName;
};

export function assignStandardArrayValue(
  current: AbilityAssignment,
  ability: AbilityName,
  value: number,
): AbilityAssignment {
  return { ...current, [ability]: value };
}
export function validateStandardArrayAssignment(
  scores: AbilityAssignment,
): readonly AbilityDiagnostic[] {
  const values = abilityNames.map((a) => scores[a]);
  const diagnostics: AbilityDiagnostic[] = [];
  if (values.some((v) => v === undefined))
    diagnostics.push({ type: 'incomplete-standard-array' });
  if (
    values.some(
      (v) =>
        v !== undefined &&
        !STANDARD_ARRAY.includes(v as (typeof STANDARD_ARRAY)[number]),
    )
  )
    diagnostics.push({ type: 'invalid-standard-array-value' });
  if (
    new Set(values.filter((v) => v !== undefined)).size !==
    values.filter((v) => v !== undefined).length
  )
    diagnostics.push({ type: 'duplicate-standard-array-value' });
  return diagnostics;
}
export interface PointBuyResult {
  readonly scores: AbilityAssignment;
  readonly costs: Readonly<Partial<Record<AbilityName, number>>>;
  readonly totalSpent: number;
  readonly pointsRemaining: number;
  readonly diagnostics: readonly AbilityDiagnostic[];
}
export function calculatePointBuy(
  scores: AbilityAssignment,
  requireExact = true,
): PointBuyResult {
  const diagnostics: AbilityDiagnostic[] = [];
  const costs: Partial<Record<AbilityName, number>> = {};
  for (const ability of abilityNames) {
    const score = scores[ability];
    if (
      score === undefined ||
      !Number.isInteger(score) ||
      POINT_BUY_COSTS[score] === undefined
    )
      diagnostics.push({ type: 'invalid-point-buy-score', ability });
    else costs[ability] = POINT_BUY_COSTS[score];
  }
  const totalSpent = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  if (totalSpent > POINT_BUY_BUDGET)
    diagnostics.push({ type: 'point-buy-budget-exceeded' });
  else if (requireExact && totalSpent < POINT_BUY_BUDGET)
    diagnostics.push({ type: 'point-buy-budget-unspent' });
  return {
    scores: { ...scores },
    costs,
    totalSpent,
    pointsRemaining: POINT_BUY_BUDGET - totalSpent,
    diagnostics,
  };
}
export type ManualAbilityValidationMode = 'strict' | 'permissive';
export function validateManualScores(
  scores: AbilityAssignment,
  mode: ManualAbilityValidationMode = 'strict',
): readonly AbilityDiagnostic[] {
  return abilityNames.flatMap((ability) => {
    const score = scores[ability];
    const invalid =
      score === undefined ||
      !Number.isInteger(score) ||
      (mode === 'strict' && (score < 8 || score > 15)) ||
      (mode === 'permissive' && (score < 1 || score > 30));
    return invalid ? [{ type: 'invalid-manual-score' as const, ability }] : [];
  });
}
export function isCompleteScores(
  scores: AbilityAssignment,
): scores is AbilityScores {
  return abilityNames.every((ability) => scores[ability] !== undefined);
}
