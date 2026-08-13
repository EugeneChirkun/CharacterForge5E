import type { SpellDetailView } from '../../domain/spells';
export function SpellDetailPanel({
  spell,
}: {
  readonly spell?: SpellDetailView;
}) {
  if (!spell)
    return (
      <aside className="spell-detail panel">
        <h2>Spell details</h2>
        <p>Select a spell to inspect its structured mechanics.</p>
      </aside>
    );
  return (
    <aside className="spell-detail panel" aria-live="polite">
      <p className="eyebrow">Spell details</p>
      <h2>{spell.name}</h2>
      <p>
        <strong>
          {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}{' '}
          {spell.school}
        </strong>
      </p>
      <dl>
        <dt>Casting time</dt>
        <dd>{spell.castingTime}</dd>
        <dt>Range</dt>
        <dd>{spell.range}</dd>
        <dt>Duration</dt>
        <dd>{spell.duration}</dd>
        <dt>Components</dt>
        <dd>{spell.components.join(', ') || 'None listed'}</dd>
        <dt>Preparation</dt>
        <dd>
          {spell.alwaysPrepared
            ? 'Always Prepared'
            : spell.granted
              ? 'Granted'
              : spell.prepared
                ? 'Prepared'
                : 'Not Prepared'}
        </dd>
        <dt>Granted by</dt>
        <dd>{spell.grantSourceLabels.join(', ') || 'No character grant'}</dd>
        <dt>Rules source</dt>
        <dd>{spell.sourceLabel}</dd>
        <dt>Mechanical tags</dt>
        <dd>
          {[
            ...spell.tags,
            ...(spell.ritual ? ['ritual'] : []),
            ...(spell.concentration ? ['concentration'] : []),
          ].join(', ') || 'None'}
        </dd>
      </dl>
      {spell.attackOrSaveLabel && (
        <p>
          <strong>Attack / save:</strong> {spell.attackOrSaveLabel}
        </p>
      )}
      {spell.damageSummary && (
        <p>
          <strong>Damage:</strong> {spell.damageSummary}
        </p>
      )}
      {spell.healingSummary && (
        <p>
          <strong>Healing:</strong> {spell.healingSummary}
        </p>
      )}
      {spell.scalingSummary && (
        <p>
          <strong>Scaling:</strong> {spell.scalingSummary}
        </p>
      )}
      {spell.description ? (
        <>
          <h3>Description</h3>
          <p>{spell.description}</p>
        </>
      ) : spell.summary ? (
        <>
          <h3>Summary</h3>
          <p>{spell.summary}</p>
        </>
      ) : (
        <p>Structured spell summary unavailable.</p>
      )}
      {spell.higherLevels && (
        <>
          <h3>At Higher Levels / Scaling</h3>
          <p>{spell.higherLevels}</p>
        </>
      )}
      {spell.completeness === 'summary' && (
        <p>
          <strong>Content:</strong> Summary available
        </p>
      )}
    </aside>
  );
}
