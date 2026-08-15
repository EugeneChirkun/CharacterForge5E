import type { CharacterBuild, ComputedCharacter } from '../../domain/character';
import type { RuleRegistry, SpellSchool } from '../../domain/rules';
import {
  activeSpellGrants,
  maximumSpellLevel,
  validatePreparedSpells,
} from '../../domain/spells';
import { compareSpells } from '../../domain/spells/spell-selectors';
import {
  createSpellDetailView,
  type SpellDetailView,
} from './spell-detail-view';

export interface LevelUpSpellChoices {
  readonly preparedSpellIds: readonly string[];
  readonly normalCantripIds?: readonly string[];
}
export interface LevelUpSpellCapability {
  readonly preparedLimit: number;
  readonly maximumSpellLevel: number;
  readonly cantripAllowance: number;
  readonly alwaysPreparedSpellIds: readonly string[];
  readonly grantedSpellIds: readonly string[];
}
export type LevelUpSpellDiagnosticType =
  | 'prepared-spell-limit-exceeded'
  | 'prepared-spell-count-incomplete'
  | 'inaccessible-spell-level'
  | 'not-on-druid-list'
  | 'duplicate-spell-selection'
  | 'cantrip-selected-as-prepared-spell'
  | 'always-prepared-spell-selected-as-class-prepared'
  | 'granted-spell-selected-as-class-prepared'
  | 'missing-spell-definition'
  | 'invalid-cantrip-selection';
export interface LevelUpSpellDiagnostic {
  readonly type: LevelUpSpellDiagnosticType;
  readonly spellId?: string;
  readonly message: string;
}
export interface LevelUpSpellDiff {
  readonly newlyPrepared: readonly string[];
  readonly unprepared: readonly string[];
  readonly newlyAlwaysPrepared: readonly string[];
  readonly removedAlwaysPrepared: readonly string[];
  readonly newlyGranted: readonly string[];
  readonly removedGranted: readonly string[];
  readonly newlyAccessibleSpellLevels: readonly number[];
}
export interface LevelUpSpellQuery {
  readonly search?: string;
  readonly level?: number;
  readonly preparation?: 'all' | 'prepared' | 'not-prepared';
  readonly concentration?: boolean;
  readonly ritual?: boolean;
  readonly school?: SpellSchool;
}
export interface LevelUpSpellSelectionView {
  readonly classSpells: readonly SpellDetailView[];
  readonly alwaysPrepared: readonly SpellDetailView[];
  readonly granted: readonly SpellDetailView[];
  readonly preparedCount: number;
  readonly preparedLimit: number;
  readonly diagnostics: readonly LevelUpSpellDiagnostic[];
}

export function spellCapability(
  character: ComputedCharacter,
): LevelUpSpellCapability {
  return {
    preparedLimit: character.classLevel?.preparedSpells ?? 0,
    maximumSpellLevel: character.classLevel?.maximumSpellLevel ?? 0,
    cantripAllowance: character.classLevel?.cantripsKnown ?? 0,
    alwaysPreparedSpellIds: character.spells
      .filter((s) => s.sourceTypes.includes('subclass'))
      .map((s) => s.spellId),
    grantedSpellIds: character.spells
      .filter((s) => s.sourceTypes.includes('species'))
      .map((s) => s.spellId),
  };
}
export function shouldReviewSpellsOnLevelUp({
  before,
  after,
}: {
  before: ComputedCharacter;
  after: ComputedCharacter;
  build: CharacterBuild;
  registry: RuleRegistry;
}): boolean {
  const a = spellCapability(before),
    b = spellCapability(after);
  return (
    a.preparedLimit !== b.preparedLimit ||
    a.maximumSpellLevel !== b.maximumSpellLevel ||
    a.cantripAllowance !== b.cantripAllowance ||
    !same(a.alwaysPreparedSpellIds, b.alwaysPreparedSpellIds) ||
    !same(a.grantedSpellIds, b.grantedSpellIds)
  );
}

export function getTargetSpellCapability(
  build: CharacterBuild,
  level: number,
  landType: string | undefined,
  registry: RuleRegistry,
): LevelUpSpellCapability {
  const row = registry.classes.druid.progression.find(
    (p) => p.level === level,
  )!;
  const grants = activeSpellGrants(registry, level, landType).filter(
    (g) =>
      (g.sourceType === 'subclass' &&
        build.class?.subclassId?.includes('circle') &&
        g.sourceId === 'circle-of-the-land') ||
      (g.sourceType === 'species' && build.species?.optionId === g.sourceId),
  );
  return {
    preparedLimit: row.preparedSpells,
    maximumSpellLevel: maximumSpellLevel(row.spellSlots),
    cantripAllowance: row.cantripsKnown,
    alwaysPreparedSpellIds: unique(
      grants.filter((g) => g.sourceType === 'subclass').map((g) => g.spellId),
    ),
    grantedSpellIds: unique(
      grants.filter((g) => g.sourceType !== 'subclass').map((g) => g.spellId),
    ),
  };
}

export function validateLevelUpSpellChoices(
  choices: LevelUpSpellChoices,
  capability: LevelUpSpellCapability,
  registry: RuleRegistry,
): readonly LevelUpSpellDiagnostic[] {
  const grants = [
    ...capability.alwaysPreparedSpellIds,
    ...capability.grantedSpellIds,
  ].map((spellId) => ({
    spellId,
    alwaysPrepared: capability.alwaysPreparedSpellIds.includes(spellId),
  }));
  const base = validatePreparedSpells({
    preparedSpellIds: choices.preparedSpellIds,
    classId: 'druid',
    maximum: capability.preparedLimit,
    maximumSpellLevel: capability.maximumSpellLevel,
    grants: grants as never,
    registry,
  });
  const diagnostics: LevelUpSpellDiagnostic[] = base.diagnostics.map((d) => {
    const spellId = 'spellId' in d ? d.spellId : undefined;
    const always =
      spellId && capability.alwaysPreparedSpellIds.includes(spellId);
    const mapping: Record<string, LevelUpSpellDiagnosticType> = {
      'too-many-prepared-spells': 'prepared-spell-limit-exceeded',
      'not-on-class-list': 'not-on-druid-list',
      'cantrip-in-prepared-spells': 'cantrip-selected-as-prepared-spell',
      'granted-spell-counted-as-class': always
        ? 'always-prepared-spell-selected-as-class-prepared'
        : 'granted-spell-selected-as-class-prepared',
      'inaccessible-spell-level': 'inaccessible-spell-level',
      'duplicate-spell-selection': 'duplicate-spell-selection',
      'missing-spell-definition': 'missing-spell-definition',
    };
    const type = mapping[d.type];
    return {
      type,
      ...(spellId ? { spellId } : {}),
      message: diagnosticMessage(type, spellId, capability.preparedLimit),
    };
  });
  if (choices.preparedSpellIds.length < capability.preparedLimit)
    diagnostics.push({
      type: 'prepared-spell-count-incomplete',
      message: diagnosticMessage(
        'prepared-spell-count-incomplete',
        undefined,
        capability.preparedLimit,
      ),
    });
  const cantrips = choices.normalCantripIds ?? [];
  if (
    cantrips.length !== capability.cantripAllowance ||
    new Set(cantrips).size !== cantrips.length ||
    cantrips.some(
      (id) =>
        registry.spells[id]?.level !== 0 ||
        !registry.spells[id]?.classIds.includes('druid'),
    )
  )
    diagnostics.push({
      type: 'invalid-cantrip-selection',
      message: `Choose exactly ${capability.cantripAllowance} normal Druid cantrips.`,
    });
  return diagnostics;
}

export function buildLevelUpSpellSelectionView(
  build: CharacterBuild,
  choices: LevelUpSpellChoices,
  capability: LevelUpSpellCapability,
  query: LevelUpSpellQuery,
  registry: RuleRegistry,
): LevelUpSpellSelectionView {
  const selected = new Set(choices.preparedSpellIds);
  const term = (query.search ?? '').trim().toLowerCase();
  const classSpells = Object.values(registry.spells)
    .filter(
      (s) =>
        s.source.verified &&
        s.level > 0 &&
        s.level <= capability.maximumSpellLevel &&
        s.classIds.includes('druid') &&
        !capability.alwaysPreparedSpellIds.includes(s.id) &&
        !capability.grantedSpellIds.includes(s.id),
    )
    .filter(
      (s) =>
        !term ||
        [s.name, s.summary ?? '', s.description ?? '', ...s.tags]
          .join(' ')
          .toLowerCase()
          .includes(term),
    )
    .filter((s) => query.level === undefined || s.level === query.level)
    .filter((s) => query.school === undefined || s.school === query.school)
    .filter((s) => !query.concentration || s.concentration)
    .filter((s) => !query.ritual || s.ritual)
    .filter(
      (s) =>
        !query.preparation ||
        query.preparation === 'all' ||
        (query.preparation === 'prepared') === selected.has(s.id),
    )
    .sort(compareSpells)
    .map((s) =>
      createSpellDetailView(
        s,
        [{ type: 'class', sourceId: 'druid', label: 'Druid' }],
        build.totalLevel + 1,
      ),
    );
  const details = (
    ids: readonly string[],
    label: string,
    type: 'subclass' | 'species',
  ) =>
    ids
      .flatMap((id) =>
        registry.spells[id]
          ? [
              createSpellDetailView(
                registry.spells[id],
                [{ type, sourceId: type, label }],
                build.totalLevel + 1,
              ),
            ]
          : [],
      )
      .sort(compareSpells);
  return {
    classSpells,
    alwaysPrepared: details(
      capability.alwaysPreparedSpellIds,
      'Circle of the Land',
      'subclass',
    ),
    granted: details(capability.grantedSpellIds, 'Chthonic Legacy', 'species'),
    preparedCount: choices.preparedSpellIds.length,
    preparedLimit: capability.preparedLimit,
    diagnostics: validateLevelUpSpellChoices(choices, capability, registry),
  };
}
export function previewLevelUpSpellChanges(
  before: LevelUpSpellCapability,
  after: LevelUpSpellCapability,
  beforePrepared: readonly string[],
  afterPrepared: readonly string[],
): LevelUpSpellDiff {
  return {
    newlyPrepared: difference(afterPrepared, beforePrepared),
    unprepared: difference(beforePrepared, afterPrepared),
    newlyAlwaysPrepared: difference(
      after.alwaysPreparedSpellIds,
      before.alwaysPreparedSpellIds,
    ),
    removedAlwaysPrepared: difference(
      before.alwaysPreparedSpellIds,
      after.alwaysPreparedSpellIds,
    ),
    newlyGranted: difference(after.grantedSpellIds, before.grantedSpellIds),
    removedGranted: difference(before.grantedSpellIds, after.grantedSpellIds),
    newlyAccessibleSpellLevels: Array.from(
      { length: after.maximumSpellLevel },
      (_, i) => i + 1,
    ).filter((x) => x > before.maximumSpellLevel),
  };
}
const unique = (x: readonly string[]) => [...new Set(x)];
const difference = (a: readonly string[], b: readonly string[]) =>
  unique(a).filter((x) => !new Set(b).has(x));
const same = (a: readonly string[], b: readonly string[]) =>
  difference(a, b).length === 0 && difference(b, a).length === 0;
function diagnosticMessage(
  type: LevelUpSpellDiagnosticType,
  spellId?: string,
  limit?: number,
) {
  const name = spellId ? `“${spellId}”` : 'A spell';
  const messages: Record<LevelUpSpellDiagnosticType, string> = {
    'prepared-spell-limit-exceeded': `Prepared Druid spells exceed the limit of ${limit}.`,
    'prepared-spell-count-incomplete': `Prepare exactly ${limit} Druid spells to continue.`,
    'inaccessible-spell-level': `${name} is above the accessible spell level.`,
    'not-on-druid-list': `${name} is not on the Druid spell list.`,
    'duplicate-spell-selection': `${name} was selected more than once.`,
    'cantrip-selected-as-prepared-spell': `${name} is a cantrip and does not use preparation.`,
    'always-prepared-spell-selected-as-class-prepared': `${name} is always prepared and cannot count as a class choice.`,
    'granted-spell-selected-as-class-prepared': `${name} is species-granted and cannot count as a class choice.`,
    'missing-spell-definition': `${name} is missing from the installed rules.`,
    'invalid-cantrip-selection':
      'The normal Druid cantrip selection is invalid.',
  };
  return messages[type];
}
