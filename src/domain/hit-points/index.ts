import {
  CharacterValidationError,
  type CalculationResult,
} from '../calculation';
export interface HitPointLevelGain {
  readonly level: number;
  readonly baseHitPoints: number;
}
export interface PerLevelHitPointBonus {
  readonly source: string;
  readonly amount: number;
}
export interface FlatHitPointBonus {
  readonly source: string;
  readonly amount: number;
}
export interface HitPointProgression {
  readonly hitDie: 6 | 8 | 10 | 12;
  readonly levelGains: readonly HitPointLevelGain[];
  readonly perLevelBonuses: readonly PerLevelHitPointBonus[];
  readonly flatBonuses: readonly FlatHitPointBonus[];
}
export function calculateMaximumHp(input: {
  readonly level: number;
  readonly constitutionModifier: number;
  readonly progression: HitPointProgression;
}): CalculationResult<number> {
  const { level, constitutionModifier, progression } = input;
  const levels = new Set<number>();
  for (const gain of progression.levelGains) {
    if (levels.has(gain.level))
      throw new CharacterValidationError(
        'DUPLICATE_HP_LEVEL_GAIN',
        `Duplicate HP gain for level ${gain.level}.`,
      );
    if (!Number.isInteger(gain.baseHitPoints) || gain.baseHitPoints < 0)
      throw new CharacterValidationError(
        'INVALID_HP_GAIN',
        'HP gains must be non-negative integers.',
      );
    levels.add(gain.level);
  }
  for (let current = 1; current <= level; current += 1)
    if (!levels.has(current))
      throw new CharacterValidationError(
        'MISSING_HP_LEVEL_GAIN',
        `Missing HP gain for level ${current}.`,
      );
  if (
    progression.levelGains.length !== level ||
    progression.levelGains.find((g) => g.level === 1)?.baseHitPoints !==
      progression.hitDie
  )
    throw new CharacterValidationError(
      'INVALID_HP_PROGRESSION',
      'HP progression must contain exactly each level and use the maximum hit die at level 1.',
    );
  const first = progression.hitDie;
  const later = progression.levelGains
    .filter((g) => g.level > 1)
    .reduce((sum, g) => sum + g.baseHitPoints, 0);
  const constitution = constitutionModifier * level;
  const perLevel = progression.perLevelBonuses.map((b) => ({
    label: b.source,
    value: b.amount * level,
  }));
  const flat = progression.flatBonuses.map((b) => ({
    label: b.source,
    value: b.amount,
  }));
  const steps = [
    { label: 'Level 1 Hit Points', value: first },
    { label: `Levels 2-${level} Base Gains`, value: later },
    { label: 'Constitution Bonus', value: constitution },
    ...perLevel,
    ...flat,
  ];
  return { value: steps.reduce((sum, step) => sum + step.value, 0), steps };
}
