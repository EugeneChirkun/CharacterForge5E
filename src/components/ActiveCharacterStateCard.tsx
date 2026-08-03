import { useState } from 'react';
import type {
  BeastDefinition,
  CharacterState,
} from '../domain/character-state';

export interface ActiveStatePresentation {
  readonly state: CharacterState;
  readonly beast?: BeastDefinition;
  readonly uses: number;
}
export function ActiveCharacterStateCard({
  activeState,
  onTransform,
  onRevert,
}: {
  activeState: ActiveStatePresentation;
  onTransform: () => void;
  onRevert: () => void;
}) {
  const [details, setDetails] = useState(false);
  const { state, beast, uses } = activeState;
  return (
    <section className="active-state-card" aria-label="Active character state">
      {state.type === 'normal' ? (
        <>
          <div className="beast-placeholder" aria-hidden="true">
            🐾
          </div>
          <div>
            <p className="eyebrow">Current Form</p>
            <h2>Normal Form</h2>
            <p>
              Wild Shape Uses Remaining: <strong>{uses}</strong>
            </p>
          </div>
          <button onClick={onTransform} disabled={uses < 1}>
            Transform
          </button>
        </>
      ) : (
        <>
          <div
            className="beast-placeholder"
            aria-label="Beast artwork unavailable"
          >
            🐾
          </div>
          <div>
            <p className="eyebrow">🐾 Current Form</p>
            <h2>{beast?.name ?? 'Unknown Beast'}</h2>
            <dl className="state-stats">
              <div>
                <dt>Challenge Rating</dt>
                <dd>{beast?.challengeRating}</dd>
              </div>
              <div>
                <dt>Armor Class</dt>
                <dd>{beast?.armorClass}</dd>
              </div>
              <div>
                <dt>Current Beast HP</dt>
                <dd>{state.payload.currentBeastHp}</dd>
              </div>
              <div>
                <dt>Maximum Beast HP</dt>
                <dd>{state.payload.maximumBeastHp}</dd>
              </div>
              <div>
                <dt>Movement</dt>
                <dd>{beast?.speed}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{beast?.size}</dd>
              </div>
              <div>
                <dt>Senses</dt>
                <dd>{beast?.senses.join(', ')}</dd>
              </div>
            </dl>
            <p>
              Remaining Wild Shape Uses: <strong>{uses}</strong>
            </p>
          </div>
          <div className="state-actions">
            <button className="danger" onClick={onRevert}>
              End Wild Shape
            </button>
            <button className="secondary" onClick={() => setDetails(true)}>
              View Beast Details
            </button>
          </div>
        </>
      )}
      {details && beast && (
        <div className="dialog-backdrop">
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`${beast.name} details`}
          >
            <h2>{beast.name}</h2>
            <dl className="state-stats">
              <div>
                <dt>AC</dt>
                <dd>{beast.armorClass}</dd>
              </div>
              <div>
                <dt>HP</dt>
                <dd>{beast.hitPoints}</dd>
              </div>
              <div>
                <dt>Speed</dt>
                <dd>{beast.speed}</dd>
              </div>
            </dl>
            <h3>Abilities</h3>
            <p>
              {Object.entries(beast.abilityScores)
                .map(([a, v]) => `${a.slice(0, 3).toUpperCase()} ${v}`)
                .join(' · ')}
            </p>
            <h3>Skills</h3>
            <p>
              {Object.entries(beast.skills)
                .map(([s, v]) => `${s} +${v}`)
                .join(', ') || 'None'}
            </p>
            <h3>Senses</h3>
            <p>{beast.senses.join(', ')}</p>
            <h3>Actions</h3>
            <ul>
              {beast.actions.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h3>Traits</h3>
            <ul>
              {beast.traits.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p>
              <small>{beast.source} · Verified</small>
            </p>
            <button onClick={() => setDetails(false)}>Close</button>
          </section>
        </div>
      )}
    </section>
  );
}
