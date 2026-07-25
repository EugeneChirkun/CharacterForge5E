import { useEffect, useRef } from 'react';
import type { LandType } from '../features/characters/character.types';
import type { RestPreview, RestType } from '../features/rests/rest.types';
const lands: LandType[] = ['arid', 'polar', 'temperate', 'tropical'];
export function RestDialog({
  type,
  preview,
  land,
  onLand,
  close,
  confirm,
}: {
  type: RestType;
  preview: RestPreview;
  land: LandType;
  onLand: (v: LandType) => void;
  close: () => void;
  confirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={close} aria-labelledby="rest-title">
      <div className="dialog-icon">{type === 'short' ? '☼' : '☾'}</div>
      <h2 id="rest-title">{preview.title}</h2>
      <p>Review these fixture recoveries before continuing.</p>
      <ul>
        {preview.items.length ? (
          preview.items.map((i) => <li key={i}>{i}</li>)
        ) : (
          <li>No depleted resources recover.</li>
        )}
      </ul>
      {type === 'long' && (
        <label className="land-select">
          <span>Land after rest</span>
          <select
            value={land}
            onChange={(e) => onLand(e.target.value as LandType)}
          >
            {lands.map((l) => (
              <option key={l} value={l}>
                {l[0].toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="dialog-actions">
        <button className="secondary" onClick={close}>
          Cancel
        </button>
        <button onClick={confirm}>Confirm {type} rest</button>
      </div>
    </dialog>
  );
}
