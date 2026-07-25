import type { RuleRegistry, SpellGrant } from '../rules';
export type SpellDiagnostic =
  | {
      readonly type: 'too-many-prepared-spells';
      readonly maximum: number;
      readonly actual: number;
    }
  | {
      readonly type: 'inaccessible-spell-level';
      readonly spellId: string;
      readonly spellLevel: number;
      readonly maximumSpellLevel: number;
    }
  | {
      readonly type: 'not-on-class-list';
      readonly spellId: string;
      readonly classId: string;
    }
  | { readonly type: 'duplicate-spell-selection'; readonly spellId: string }
  | { readonly type: 'missing-spell-definition'; readonly spellId: string }
  | { readonly type: 'cantrip-in-prepared-spells'; readonly spellId: string }
  | {
      readonly type: 'granted-spell-counted-as-class';
      readonly spellId: string;
    };
export interface PreparedSpellValidation {
  readonly validPreparedSpellIds: readonly string[];
  readonly alwaysPreparedSpellIds: readonly string[];
  readonly grantedSpellIds: readonly string[];
  readonly diagnostics: readonly SpellDiagnostic[];
}
export function maximumSpellLevel(
  slots: Readonly<Record<number, number>>,
): number {
  return Math.max(
    0,
    ...Object.keys(slots)
      .filter((k) => slots[Number(k)] > 0)
      .map(Number),
  );
}
export function activeSpellGrants(
  registry: RuleRegistry,
  level: number,
  landType?: string,
): readonly SpellGrant[] {
  return Object.values(registry.spellGrants).filter(
    (g) =>
      g.source.verified &&
      g.unlockedAtCharacterLevel <= level &&
      (!g.landType || g.landType === landType),
  );
}
export function validatePreparedSpells(input: {
  preparedSpellIds: readonly string[];
  classId: string;
  maximum: number;
  maximumSpellLevel: number;
  grants: readonly SpellGrant[];
  registry: RuleRegistry;
}): PreparedSpellValidation {
  const diagnostics: SpellDiagnostic[] = [];
  const valid: string[] = [];
  const seen = new Set<string>();
  const granted = new Set(input.grants.map((g) => g.spellId));
  for (const spellId of input.preparedSpellIds) {
    if (seen.has(spellId)) {
      diagnostics.push({ type: 'duplicate-spell-selection', spellId });
      continue;
    }
    seen.add(spellId);
    const spell = input.registry.spells[spellId];
    if (!spell) {
      diagnostics.push({ type: 'missing-spell-definition', spellId });
      continue;
    }
    if (granted.has(spellId)) {
      diagnostics.push({ type: 'granted-spell-counted-as-class', spellId });
      continue;
    }
    if (spell.level === 0) {
      diagnostics.push({ type: 'cantrip-in-prepared-spells', spellId });
      continue;
    }
    if (spell.level > input.maximumSpellLevel) {
      diagnostics.push({
        type: 'inaccessible-spell-level',
        spellId,
        spellLevel: spell.level,
        maximumSpellLevel: input.maximumSpellLevel,
      });
      continue;
    }
    if (!spell.classIds.includes(input.classId)) {
      diagnostics.push({
        type: 'not-on-class-list',
        spellId,
        classId: input.classId,
      });
      continue;
    }
    valid.push(spellId);
  }
  if (seen.size > input.maximum)
    diagnostics.push({
      type: 'too-many-prepared-spells',
      maximum: input.maximum,
      actual: seen.size,
    });
  return {
    validPreparedSpellIds: valid,
    alwaysPreparedSpellIds: [
      ...new Set(
        input.grants.filter((g) => g.alwaysPrepared).map((g) => g.spellId),
      ),
    ],
    grantedSpellIds: [...new Set(input.grants.map((g) => g.spellId))],
    diagnostics,
  };
}
