import type { ContentCompleteness, SpellDefinition } from '../rules';

export type SpellContentField =
  | 'id'
  | 'name'
  | 'casting-time'
  | 'range'
  | 'components'
  | 'material-components'
  | 'duration'
  | 'description'
  | 'source'
  | 'primary-effect';

export interface SpellContentAuditResult {
  readonly spellId: string;
  readonly missingFields: readonly SpellContentField[];
  readonly completeness: ContentCompleteness;
}

const placeholder =
  /see imported rules content|detailed rules text|mechanics only|summary only/i;

/** Audits content fields, including requirements that only apply conditionally. */
export function auditSpellContent(
  spell: SpellDefinition,
): SpellContentAuditResult {
  const missing: SpellContentField[] = [];
  if (!spell.id.trim()) missing.push('id');
  if (!spell.name.trim()) missing.push('name');
  if (!spell.castingTime.trim()) missing.push('casting-time');
  if (!spell.range.trim() || placeholder.test(spell.range))
    missing.push('range');
  if (!spell.components) missing.push('components');
  if (
    spell.components.material &&
    !spell.components.materialRequirement?.trim()
  )
    missing.push('material-components');
  if (!spell.duration.trim() || placeholder.test(spell.duration))
    missing.push('duration');
  if (!spell.description.trim() || placeholder.test(spell.description))
    missing.push('description');
  if (!spell.source.verified || !spell.content.source) missing.push('source');
  if (!(
    spell.effects?.length ||
    spell.damage?.length ||
    spell.healing?.length ||
    spell.attackType ||
    spell.savingThrow
  ))
    missing.push('primary-effect');
  return {
    spellId: spell.id,
    missingFields: missing,
    completeness: spell.content.completeness,
  };
}
