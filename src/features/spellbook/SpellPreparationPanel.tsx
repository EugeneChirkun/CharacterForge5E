import type { SpellbookView } from '../../domain/spells';
export function SpellPreparationPanel({
  view,
}: {
  readonly view: SpellbookView;
}) {
  return (
    <section className="preparation-summary panel">
      <h2>Preparation</h2>
      <div>
        <strong>Prepared</strong>
        <span>
          {view.preparedCount} / {view.preparedLimit}
        </span>
      </div>
      <div>
        <strong>Always Prepared</strong>
        <span>{view.alwaysPreparedCount}</span>
      </div>
      <div>
        <strong>Granted</strong>
        <span>{view.grantedCount}</span>
      </div>
      {view.diagnostics.length > 0 && (
        <details>
          <summary>Validation messages ({view.diagnostics.length})</summary>
          <ul>
            {view.diagnostics.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
