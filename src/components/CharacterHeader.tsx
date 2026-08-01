import type { CharacterViewModel } from '../features/characters/character.types';

export function CharacterHeader({
  character,
}: {
  character: CharacterViewModel;
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
      <section className="character-header__options" aria-label="Circle Land">
        <strong>Circle Land</strong>
        <p>
          {character.landType[0].toUpperCase() + character.landType.slice(1)}
        </p>
        <small>
          Circle Land can be changed only when confirming a Long Rest.
        </small>
      </section>
    </header>
  );
}
