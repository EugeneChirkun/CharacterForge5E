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
  onLandChange: (land: LandType) => void;
}) {
  const details = [
    ['Level', character.level],
    ['Class', character.characterClass],
    ['Subclass', character.subclass],
    ['Species', character.species],
    ['Legacy', character.legacy],
    ['Background', character.background],
  ];
  return (
    <header className="sheet-header character-header">
      <section className="character-identity character-header__identity">
        <p className="eyebrow">Character name</p>
        <h1 className="character-header__name">{character.name}</h1>
      </section>
      <dl className="character-details character-header__metadata">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <section className="character-header__options"><label className="land-select">
        <span>Circle land</span>
        <select
          value={character.landType}
          onChange={(event) => onLandChange(event.target.value as LandType)}
        >
          {lands.map((land) => (
            <option value={land} key={land}>
              {land[0].toUpperCase() + land.slice(1)}
            </option>
          ))}
        </select>
      </label></section>
    </header>
  );
}
