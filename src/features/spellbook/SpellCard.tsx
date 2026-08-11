import type { SpellCardView } from '../../domain/spells';
export function SpellCard({
  spell,
  selected,
  onSelect,
  onToggle,
}: {
  readonly spell: SpellCardView;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onToggle: () => void;
}) {
  const status = spell.alwaysPrepared
    ? '★ Always Prepared'
    : spell.granted
      ? '★ Granted'
      : spell.prepared
        ? '✓ Prepared'
        : spell.available
          ? 'Not Prepared'
          : 'Unavailable';
  return (
    <article
      className={`spellbook-card${spell.available ? '' : ' unavailable'}`}
    >
      <button
        className="spell-select"
        aria-pressed={selected}
        aria-label={`Inspect ${spell.name}, ${status}`}
        onClick={onSelect}
      >
        <span>
          <strong>{spell.name}</strong>
          <small>
            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} ·{' '}
            {spell.school}
          </small>
        </span>
        <span className="spell-status">{status}</span>
        <span className="badges">
          {spell.sources.map((source) => (
            <span className="badge" key={source}>
              {source === 'magic-item'
                ? 'Magic Item'
                : source === 'primal-order'
                  ? 'Primal Order: Magician'
                : source[0].toUpperCase() + source.slice(1)}
            </span>
          ))}
        </span>
        <small>
          {spell.castingTime} · {spell.range} · {spell.duration}
        </small>
        {spell.attackOrSaveLabel && <small>{spell.attackOrSaveLabel}</small>}
        {spell.damageSummary && <small>Damage: {spell.damageSummary}</small>}
        {spell.healingSummary && <small>Healing: {spell.healingSummary}</small>}
        <small>
          {spell.components.join(', ') || 'No components listed'}
          {spell.components.includes('Material') ? ' · Material required' : ''}
        </small>
        <span className="badges">
          {spell.ritual && <span className="badge">Ritual</span>}
          {spell.concentration && <span className="badge">Concentration</span>}
          {spell.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </span>
      </button>
      {spell.canTogglePreparation && (
        <button className="secondary prepare-toggle" onClick={onToggle}>
          {spell.prepared ? 'Unprepare' : 'Prepare'}
        </button>
      )}
    </article>
  );
}
