import type { RuleRegistry } from '../../domain/rules';
import { maximumSpellLevel, validatePreparedSpells } from '../../domain/spells';

export interface SpellPreparationDraft { readonly preparedDruidSpellIds: readonly string[]; }
export type SpellPreparationDiagnostic =
  | { readonly type: 'unknown-spell' | 'spell-not-on-druid-list' | 'spell-level-not-accessible' | 'cantrip-cannot-be-prepared' | 'prepared-spell-limit-exceeded' | 'duplicate-spell-selection' | 'derived-spell-cannot-be-unprepared' | 'invalid-level-up-spell-draft'; readonly message: string };

export function createPreparationDraft(ids: readonly string[]): SpellPreparationDraft {
  return { preparedDruidSpellIds: [...new Set(ids)] };
}
export function validatePreparationDraft(draft: SpellPreparationDraft, level: number, registry: RuleRegistry): readonly SpellPreparationDiagnostic[] {
  const progression = registry.classes.druid.progression.find((row) => row.level === level);
  if (!progression) return [{ type: 'invalid-level-up-spell-draft', message: 'The prospective Druid level is unavailable.' }];
  const labels: Record<string, SpellPreparationDiagnostic['type']> = {
    'missing-spell-definition': 'unknown-spell', 'not-on-class-list': 'spell-not-on-druid-list',
    'inaccessible-spell-level': 'spell-level-not-accessible', 'cantrip-in-prepared-spells': 'cantrip-cannot-be-prepared',
    'too-many-prepared-spells': 'prepared-spell-limit-exceeded', 'duplicate-spell-selection': 'duplicate-spell-selection',
    'granted-spell-counted-as-class': 'derived-spell-cannot-be-unprepared',
  };
  return validatePreparedSpells({ preparedSpellIds: draft.preparedDruidSpellIds, classId: 'druid', maximum: progression.preparedSpells, maximumSpellLevel: maximumSpellLevel(progression.spellSlots), grants: [], registry }).diagnostics.map((d) => ({
    type: labels[d.type] ?? 'invalid-level-up-spell-draft',
    message: d.type === 'too-many-prepared-spells' ? `Prepare no more than ${d.maximum} Druid spells.` : `The spell preparation selection is invalid (${d.type.replaceAll('-', ' ')}).`,
  }));
}
export function togglePreparationDraft(draft: SpellPreparationDraft, spellId: string, level: number, registry: RuleRegistry): { readonly draft: SpellPreparationDraft; readonly diagnostics: readonly SpellPreparationDiagnostic[] } {
  const ids = draft.preparedDruidSpellIds.includes(spellId) ? draft.preparedDruidSpellIds.filter((id) => id !== spellId) : [...draft.preparedDruidSpellIds, spellId];
  const next = createPreparationDraft(ids);
  const diagnostics = validatePreparationDraft(next, level, registry);
  return diagnostics.length ? { draft, diagnostics } : { draft: next, diagnostics: [] };
}
export const prepareSpell = togglePreparationDraft;
export const unprepareSpell = togglePreparationDraft;
export const resetPreparationDraft = createPreparationDraft;
