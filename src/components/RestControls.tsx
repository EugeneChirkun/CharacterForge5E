import type { RestType } from '../features/rests/rest.types';
export function RestControls({ onRest }: { onRest: (r: RestType) => void }) {
  return (
    <div className="rest-controls" aria-label="Rest controls">
      <button className="secondary" onClick={() => onRest('short')}>
        ☼ Short Rest
      </button>
      <button onClick={() => onRest('long')}>☾ Long Rest</button>
    </div>
  );
}
