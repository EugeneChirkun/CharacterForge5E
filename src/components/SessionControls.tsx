import { useState } from 'react';
import { conditionIds, type ConditionId } from '../application/session';
import type { CharacterViewModel } from '../features/characters/character.types';

export interface SessionActions {
  damage(amount: number): void;
  heal(amount: number): void;
  setHp(value: number): void;
  setTempHp(value: number): void;
  clearTempHp(): void;
  spendSlot(level: number): void;
  restoreSlot(level: number): void;
  spendResource(id: string): void;
  restoreResource(id: string): void;
  setCondition(id: ConditionId, active: boolean): void;
  startConcentration(spellId: string): void;
  endConcentration(): void;
  undo(): void;
  adjustMaximumHp(delta: number, reason?: string): void;
  resetMaximumHpAdjustment(): void;
}
const label = (id: string) => id[0].toUpperCase() + id.slice(1);
export function SessionControls({
  c,
  actions,
  error,
  history,
}: {
  c: CharacterViewModel;
  actions: SessionActions;
  error: string;
  history: readonly string[];
}) {
  const [amount, setAmount] = useState(1);
  const [maximumReason, setMaximumReason] = useState(
    c.maximumHpAdjustmentReason ?? '',
  );
  return (
    <section className="session-controls" aria-labelledby="session-heading">
      <h2 id="session-heading">Session</h2>
      {error && (
        <p className="validation" role="alert">
          {error}
        </p>
      )}
      <article className="panel">
        <h3>Hit Points</h3>
        <label>
          HP now{' '}
          <input
            aria-label="Current HP"
            type="number"
            min="0"
            max={c.maximumHp}
            value={c.currentHp}
            onChange={(e) => actions.setHp(e.currentTarget.valueAsNumber)}
          />
        </label>
        <label>
          Temp HP now{' '}
          <input
            aria-label="Temporary HP"
            type="number"
            min="0"
            value={c.temporaryHp}
            onChange={(e) => actions.setTempHp(e.currentTarget.valueAsNumber)}
          />
        </label>
        <label>
          Amount{' '}
          <input
            aria-label="HP action amount"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.currentTarget.valueAsNumber)}
          />
        </label>
        <div className="button-row">
          <button onClick={() => actions.damage(amount)}>Damage</button>
          <button onClick={() => actions.heal(amount)}>Heal</button>
          <button onClick={() => actions.setTempHp(amount)}>Temp HP</button>
          <button onClick={actions.clearTempHp}>Clear Temp HP</button>
        </div>
        <dl>
          <div>
            <dt>Effective Maximum HP</dt>
            <dd>{c.maximumHp}</dd>
          </div>
          <div>
            <dt>Base Maximum HP</dt>
            <dd>{c.baseMaximumHp ?? c.maximumHp}</dd>
          </div>
          <div>
            <dt>Adjustment</dt>
            <dd>{c.maximumHpAdjustment ?? 0}</dd>
          </div>
        </dl>
        <label>
          Reason (optional){' '}
          <input
            value={maximumReason}
            onChange={(event) => setMaximumReason(event.currentTarget.value)}
          />
        </label>
        <div className="button-row">
          <button onClick={() => actions.adjustMaximumHp(-1, maximumReason)}>
            -1 Max
          </button>
          <button onClick={() => actions.adjustMaximumHp(1, maximumReason)}>
            +1 Max
          </button>
          <button onClick={actions.resetMaximumHpAdjustment}>Reset</button>
        </div>
      </article>
      <article className="panel">
        <h3>Resources</h3>
        {c.resources.map((r) => (
          <div className="resource-control" key={r.id}>
            <strong>{r.name}</strong>{' '}
            <span>
              {r.current} / {r.maximum}
            </span>{' '}
            <button
              disabled={r.current === 0}
              onClick={() => actions.spendResource(r.id)}
            >
              Use
            </button>
            <button
              disabled={r.current === r.maximum}
              onClick={() => actions.restoreResource(r.id)}
            >
              Restore
            </button>
          </div>
        ))}
      </article>
      <article className="panel">
        <h3>Concentration</h3>
        <p>
          {c.concentrationSpellId ? (
            <>
              Concentrating on:{' '}
              <strong>
                {c.spells.find((s) => s.id === c.concentrationSpellId)?.name ??
                  c.concentrationSpellId}
              </strong>
            </>
          ) : (
            'No Concentration'
          )}
        </p>
        <select aria-label="Concentration spell" defaultValue="">
          <option value="">Choose spell</option>
          {c.spells.map((s) => (
            <option value={s.id} key={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={(e) => {
            const select =
              e.currentTarget.parentElement?.querySelector('select');
            if (select?.value) actions.startConcentration(select.value);
          }}
        >
          Start Concentration
        </button>
        <button
          disabled={!c.concentrationSpellId}
          onClick={actions.endConcentration}
        >
          End Concentration
        </button>
      </article>
      <article className="panel">
        <h3>Conditions</h3>
        <div className="conditions-grid">
          {conditionIds.map((id) => (
            <label className="condition-option" key={id}>
              <input
                type="checkbox"
                checked={(c.conditions ?? []).includes(id)}
                onChange={(e) =>
                  actions.setCondition(id, e.currentTarget.checked)
                }
              />{' '}
              {label(id)}
            </label>
          ))}
        </div>
      </article>
      <article className="panel">
        <h3>Session history</h3>
        <button onClick={actions.undo}>Undo last change</button>
        {history.length ? (
          <ol>
            {history.map((x, i) => (
              <li key={`${i}-${x}`}>{x}</li>
            ))}
          </ol>
        ) : (
          <p>No session changes yet.</p>
        )}
      </article>
    </section>
  );
}
