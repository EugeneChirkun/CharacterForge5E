import type {
  CharacterViewModel,
  LandType,
} from '../features/characters/character.types';
const lands: LandType[] = ['arid', 'polar', 'temperate', 'tropical'];
export function CharacterHeader({
  character,
  onLandChange,
}: {
  character: CharacterViewModel;
  onLandChange: (l: LandType) => void;
}) {
  return (
    <header className="sheet-header">
      <div>
        <p className="eyebrow">
          Level {character.level} · {character.species} · {character.legacy}{' '}
          Legacy
        </p>
        <h1>{character.name}</h1>
        <p className="subtitle">
          {character.characterClass} — {character.subclass} ·{' '}
          {character.background}
        </p>
      </div>
      <label className="land-select">
        <span>Circle land</span>
        <select
          value={character.landType}
          onChange={(e) => onLandChange(e.target.value as LandType)}
        >
          {lands.map((l) => (
            <option value={l} key={l}>
              {l[0].toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
