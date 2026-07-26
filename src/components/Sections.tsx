import { useState } from 'react';
import type { CharacterViewModel } from '../features/characters/character.types';
export { CharacterSummary as Summary } from './CharacterSummary';
const groups = [
  ['Actions', ['Wild Shape', 'Spellcasting']],
  ['Bonus Actions', ['Nature’s Step']],
  ['Reactions', ['Opportunity Attack']],
  ['Other Actions', ['Study', 'Search']],
];
export function Actions() {
  return (
    <section>
      <h2>Actions</h2>
      <div className="info-grid">
        {groups.map(([g, items]) => (
          <article className="panel" key={g as string}>
            <h3>{g}</h3>
            {(items as string[]).map((i) => (
              <div className="feature" key={i}>
                <strong>{i}</strong>
                <small>Mock action summary for quick reference.</small>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
export function Spells({
  c,
  onSlots, onSpendSlot, onRestoreSlot,
}: {
  c: CharacterViewModel;
  onSlots: (c: CharacterViewModel) => void;
  onSpendSlot?: (level: number) => void;
  onRestoreSlot?: (level: number) => void;
}) {
  const [search, setSearch] = useState('');
  return (
    <section>
      <h2>Spells</h2>
      <article className="panel">
        <h3>Spell slots</h3>
        <div className="slots">
          {c.spellSlots.map((s) => (
            <div key={s.level}>
              <strong>Level {s.level}</strong>
              <div>
                {Array.from({ length: s.maximum }, (_, i) => (
                  <button
                    aria-label={`Level ${s.level} slot ${i + 1}`}
                    className={i < s.current ? 'slot full' : 'slot'}
                    key={i}
                    onClick={() =>
                      onSlots({
                        ...c,
                        spellSlots: c.spellSlots.map((x) =>
                          x.level === s.level
                            ? {
                                ...x,
                                current:
                                  i < s.current
                                    ? Math.max(0, x.current - 1)
                                    : Math.min(x.maximum, x.current + 1),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                ))}
              </div>
              <small>
                {s.current} / {s.maximum} available
              </small>
              {onSpendSlot && <div><button disabled={s.current === 0} onClick={() => onSpendSlot(s.level)}>Spend</button><button disabled={s.current === s.maximum} onClick={() => onRestoreSlot?.(s.level)}>Restore</button></div>}
            </div>
          ))}
        </div>
      </article>
      <div className="filters">
        <input
          aria-label="Search spells"
          placeholder="Search spells"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Spell level">
          <option>All levels</option>
          <option>Cantrip</option>
          <option>Level 1</option>
        </select>
        <label>
          <input type="checkbox" /> Concentration
        </label>
      </div>
      {c.spells
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        .map((s) => (
          <article className="panel spell" key={s.id}>
            <div>
              <h3>
                {s.level === 0
                  ? 'Cantrip'
                  : s.alwaysPrepared
                    ? 'Always prepared'
                    : 'Prepared spell'}
              </h3>
              <strong>{s.name}</strong>
              <p>
                {s.sources.map((x) => (
                  <span className="badge" key={x}>
                    {x[0].toUpperCase() + x.slice(1)}{' '}
                  </span>
                ))}
              </p>
            </div>
            <label>
              <input type="checkbox" defaultChecked /> Prepared
            </label>
          </article>
        ))}
    </section>
  );
}
export function Features({ c }: { c: CharacterViewModel }) {
  return (
    <section>
      <h2>Features</h2>
      <div className="info-grid">
        {(['class', 'subclass', 'species', 'background', 'feat'] as const).map(
          (x) => (
            <article className="panel" key={x}>
              <h3>{x}</h3>
              <div className="feature">
                {c.features
                  .filter((f) => f.sourceType === x)
                  .map((f) => (
                    <div key={f.id}>
                      <strong>{f.name}</strong>
                      <small>{f.summary}</small>
                    </div>
                  ))}
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
