import type { SpellDefinition } from '../../domain/rules';

export interface CantripOptionView {
  readonly spellId: string;
  readonly name: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly selectionSource: 'normal' | 'magician' | undefined;
  readonly sourceLabel?: string;
}

export interface CantripSelectionSummaryView {
  readonly normalSelected: number;
  readonly normalLimit: number;
  readonly grantedCount: number;
  readonly totalKnown: number;
}

export interface CantripSelectionView {
  readonly options: readonly CantripOptionView[];
  readonly summary: CantripSelectionSummaryView;
  readonly normalCantripIds: readonly string[];
  readonly magicianCantripId?: string;
}

/** Builds presentation state without making React responsible for spell ownership. */
export function createCantripSelectionView(
  spells: readonly SpellDefinition[],
  normalCantripIds: readonly string[],
  normalLimit: number,
  magicianCantripId?: string,
): CantripSelectionView {
  if (magicianCantripId && normalCantripIds.includes(magicianCantripId))
    throw new Error('duplicate-cantrip-selection');

  const uniqueNormalIds = [...new Set(normalCantripIds)];
  const atLimit = uniqueNormalIds.length >= normalLimit;
  const options = spells.map((spell): CantripOptionView => {
    const granted = spell.id === magicianCantripId;
    const normal = uniqueNormalIds.includes(spell.id);
    return {
      spellId: spell.id,
      name: spell.name,
      checked: granted || normal,
      disabled: granted || (atLimit && !normal),
      selectionSource: granted ? 'magician' : normal ? 'normal' : undefined,
      ...(granted ? { sourceLabel: 'Granted by Primal Order: Magician' } : {}),
    };
  });
  const grantedCount = magicianCantripId ? 1 : 0;
  return {
    options,
    normalCantripIds: uniqueNormalIds,
    ...(magicianCantripId ? { magicianCantripId } : {}),
    summary: {
      normalSelected: uniqueNormalIds.length,
      normalLimit,
      grantedCount,
      totalKnown: new Set([
        ...uniqueNormalIds,
        ...(magicianCantripId ? [magicianCantripId] : []),
      ]).size,
    },
  };
}
