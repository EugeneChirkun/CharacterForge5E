import type { SpellSchool, SpellTag, SpellGrantSourceType } from '../rules';
import { compareSpells } from './spell-selectors';

export type SpellbookSource = SpellGrantSourceType | 'feat' | 'magic-item';
export type SpellbookSort = 'level' | 'alphabetical' | 'prepared' | 'source';
export type PreparationFilter = 'all' | 'prepared' | 'not-prepared';
export type AvailabilityFilter = 'all' | 'available' | 'unavailable';

export interface SpellCardView {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly school: SpellSchool;
  readonly sources: readonly SpellbookSource[];
  readonly prepared: boolean;
  readonly alwaysPrepared: boolean;
  readonly granted: boolean;
  readonly available: boolean;
  readonly ritual: boolean;
  readonly concentration: boolean;
  readonly castingTime: string;
  readonly range: string;
  readonly duration: string;
  readonly components: readonly string[];
  readonly materialRequirement?: string;
  readonly tags: readonly SpellTag[];
  readonly canTogglePreparation: boolean;
  readonly attackOrSaveLabel?: string;
  readonly damageSummary?: string;
  readonly healingSummary?: string;
  readonly areaLabel?: string;
  readonly effectLabels: readonly string[];
  readonly scalingSummary?: string;
  readonly description: string;
  readonly higherLevels?: string;
  readonly sourceLabel: string;
  readonly completeness: import('../rules').ContentCompleteness;
}
export type SpellDetailView = SpellCardView;
export interface SpellLevelGroup {
  readonly level: number;
  readonly label: string;
  readonly spells: readonly SpellCardView[];
}
export interface ComputedSpellSlotSummary {
  readonly level: number;
  readonly remaining: number;
  readonly maximum: number;
  readonly canSpend: boolean;
  readonly canRestore: boolean;
}
export interface SpellbookFilters {
  readonly preparation: PreparationFilter;
  readonly cantrips: boolean;
  readonly ritual: boolean;
  readonly concentration: boolean;
  readonly sources: readonly SpellbookSource[];
  readonly school?: SpellSchool;
  readonly level?: number;
  readonly availability: AvailabilityFilter;
}
export const emptySpellbookFilters: SpellbookFilters = {
  preparation: 'all',
  cantrips: false,
  ritual: false,
  concentration: false,
  sources: [],
  availability: 'all',
};
export interface SpellbookQuery {
  readonly search: string;
  readonly filters: SpellbookFilters;
  readonly sort: SpellbookSort;
}
export interface SpellbookView {
  readonly groups: readonly SpellLevelGroup[];
  readonly slots: readonly ComputedSpellSlotSummary[];
  readonly preparedCount: number;
  readonly preparedLimit: number;
  readonly alwaysPreparedCount: number;
  readonly grantedCount: number;
  readonly diagnostics: readonly string[];
  readonly selected?: SpellDetailView;
  readonly resultCount: number;
}

export const searchSpells = (
  spells: readonly SpellCardView[],
  search: string,
) => {
  const term = search.trim().toLocaleLowerCase();
  return term
    ? spells.filter((spell) =>
        [spell.name, spell.school, spell.sourceLabel, spell.damageSummary ?? '']
          .join(' ')
          .toLocaleLowerCase()
          .includes(term),
      )
    : spells;
};
export function filterSpells(
  spells: readonly SpellCardView[],
  f: SpellbookFilters,
) {
  return spells.filter(
    (s) =>
      (f.preparation === 'all' ||
        (f.preparation === 'prepared') === s.prepared) &&
      (!f.cantrips || s.level === 0) &&
      (!f.ritual || s.ritual) &&
      (!f.concentration || s.concentration) &&
      (!f.sources.length ||
        f.sources.some((source) => s.sources.includes(source))) &&
      (f.school === undefined || s.school === f.school) &&
      (f.level === undefined || s.level === f.level) &&
      (f.availability === 'all' ||
        (f.availability === 'available') === s.available),
  );
}
export function sortSpellbookSpells(
  spells: readonly SpellCardView[],
  sort: SpellbookSort,
) {
  return [...spells].sort((a, b) => {
    if (sort === 'alphabetical')
      return a.name.localeCompare(b.name) || compareSpells(a, b);
    if (sort === 'prepared')
      return Number(b.prepared) - Number(a.prepared) || compareSpells(a, b);
    if (sort === 'source')
      return (
        (a.sources[0] ?? '').localeCompare(b.sources[0] ?? '') ||
        compareSpells(a, b)
      );
    return compareSpells(a, b);
  });
}
export function groupSpells(
  spells: readonly SpellCardView[],
): readonly SpellLevelGroup[] {
  const levels = [...new Set(spells.map((spell) => spell.level))].sort(
    (a, b) => a - b,
  );
  return levels.map((level) => ({
    level,
    label: level === 0 ? 'Cantrips' : `Level ${level}`,
    spells: [...spells.filter((spell) => spell.level === level)].sort(
      compareSpells,
    ),
  }));
}
