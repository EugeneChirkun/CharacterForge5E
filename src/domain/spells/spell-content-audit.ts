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
  if (!spell.castingTime) missing.push('casting-time');
  if (!spell.range || (spell.range.type === 'special' && placeholder.test(spell.range.label))) missing.push('range');
  if (!spell.components) missing.push('components');
  if (
    spell.components.material &&
    !spell.components.materialRequirement?.trim()
  )
    missing.push('material-components');
  if (!spell.duration || (spell.duration.type === 'special' && placeholder.test(spell.duration.label))) missing.push('duration');
  const usefulText = spell.description?.trim() || spell.summary?.trim();
  if (!usefulText || placeholder.test(usefulText))
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
