import { useState, type ReactNode } from 'react';
import type { SpellDetailView } from '../application/spells/spell-detail-view';

export function SpellCard({ spell, selected, disabled, disabledReason, actionLabel = 'Select', onToggle, status }: {
  spell: SpellDetailView; selected?: boolean; disabled?: boolean; disabledReason?: string;
  actionLabel?: string; onToggle?: () => void; status?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `spell-details-${spell.id}`;
  return <article className={`rich-spell-card${disabled ? ' granted' : ''}`}>
    <div className="rich-spell-heading"><div><h3>{spell.name}</h3><small>{spell.levelLabel} • {spell.schoolLabel}</small></div>{status}</div>
    <p className="spell-mechanics">{spell.castingTimeLabel} • {spell.rangeLabel} • {spell.componentsLabel || '—'}</p>
    <div className="badges">{spell.concentration && <span>Concentration</span>}{spell.ritual && <span>Ritual</span>}{spell.attackOrSaveLabel && <span>{spell.attackOrSaveLabel}</span>}</div>
    {spell.damageSummary && <p><strong>Damage:</strong> {spell.damageSummary}</p>}
    {spell.healingSummary && <p><strong>Healing:</strong> {spell.healingSummary}</p>}
    <div className="spell-card-actions">
      <button type="button" className="secondary" aria-expanded={expanded} aria-controls={detailsId} aria-label={`${expanded ? 'Hide' : 'Show'} details for ${spell.name}`} onClick={() => setExpanded((v) => !v)}>{expanded ? 'Hide details' : 'Details'}</button>
      {onToggle && <label title={disabledReason}><input type="checkbox" checked={!!selected} disabled={disabled} aria-label={`${actionLabel} ${spell.name}`} aria-describedby={disabledReason ? `${detailsId}-reason` : undefined} onChange={onToggle}/> {actionLabel}</label>}
    </div>
    {disabledReason && <small id={`${detailsId}-reason`}>{disabledReason}</small>}
    {expanded && <section className="rich-spell-details" id={detailsId} aria-label={`${spell.name} details`}>
      <dl><div><dt>Casting Time</dt><dd>{spell.castingTimeLabel}</dd></div><div><dt>Range</dt><dd>{spell.rangeLabel}</dd></div><div><dt>Components</dt><dd>{spell.componentsLabel}{spell.materialComponentText && ` (${spell.materialComponentText})`}</dd></div><div><dt>Duration</dt><dd>{spell.durationLabel}</dd></div></dl>
      {spell.attackOrSaveLabel && <p><strong>Attack / Save:</strong> {spell.attackOrSaveLabel}</p>}
      {spell.scalingSummary && <p><strong>Scaling:</strong> {spell.scalingSummary}</p>}
      <h4>Description</h4><p>{spell.description}</p>
      {spell.higherLevels && <><h4>At Higher Levels / Scaling</h4><p>{spell.higherLevels}</p></>}
      <p><strong>Source:</strong> {spell.sourceLabel}</p><small>{spell.completeness === 'full' ? 'Full description' : spell.completeness === 'summary' ? 'Summary only' : 'Mechanics only'}</small>
    </section>}
  </article>;
}
