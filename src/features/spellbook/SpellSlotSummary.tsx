import type { ComputedSpellSlotSummary } from '../../domain/spells';
export function SpellSlotSummary({
  slots,
  onSpend,
  onRestore,
}: {
  readonly slots: readonly ComputedSpellSlotSummary[];
  readonly onSpend: (level: number) => void;
  readonly onRestore: (level: number) => void;
}) {
  return (
    <section className="panel">
      <h2>Spell Slots</h2>
      <div className="slot-summary">
        {slots.map((slot) => (
          <div key={slot.level}>
            <strong>Level {slot.level}</strong>
            <span>
              {slot.remaining} / {slot.maximum}
            </span>
            <button
              disabled={!slot.canSpend}
              onClick={() => onSpend(slot.level)}
            >
              Spend
            </button>
            <button
              className="secondary"
              disabled={!slot.canRestore}
              onClick={() => onRestore(slot.level)}
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
