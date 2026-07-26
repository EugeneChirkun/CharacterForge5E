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
        <dt>Sources</dt>
        <dd>{spell.sources.join(', ') || 'No character source'}</dd>
        <dt>Mechanical tags</dt>
        <dd>
          {[
            ...spell.tags,
            ...(spell.ritual ? ['ritual'] : []),
            ...(spell.concentration ? ['concentration'] : []),
          ].join(', ') || 'None'}
        </dd>
      </dl>
    </aside>
  );
}
