import { Link, useNavigate } from 'react-router-dom';
import { useCharacter } from '../app/CharacterContext';
import { LocalCharacterRepository } from '../infrastructure/persistence/local-character-repository';
const repository = new LocalCharacterRepository(localStorage);
export function CharacterListPage() {
  const { state, setMeta, remove } = useCharacter();
  const navigate = useNavigate();
  const characters = Object.values(state.characters);
  const open = (id: string) => {
    setMeta({ lastCharacterId: id });
    navigate(`/character/${id}`);
  };
  const discard = async (id: string, name: string) => {
    if (
      id !== 'reference' &&
      confirm(`Delete ${name}? This cannot be undone.`)
    ) {
      await repository.delete(id);
      remove(id);
    }
  };
  return (
    <main className="list-page">
      <header className="brand">
        <span className="brand-mark">CF</span>
        <div>
          <p className="eyebrow">Your adventuring archive</p>
          <h1>Character Forge</h1>
        </div>
      </header>
      <section aria-labelledby="characters">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Druid MVP</p>
            <h2 id="characters">Your characters</h2>
          </div>
          <span className="count">
            {characters.length}{' '}
            {characters.length === 1 ? 'character' : 'characters'}
          </span>
        </div>
        {characters.map((character) => (
          <article className="character-card" key={character.id}>
            <div className="level-seal">
              <strong>{character.level}</strong>
              <span>Level</span>
            </div>
            <div className="card-copy">
              <p className="eyebrow">
                {character.species} · {character.background}
              </p>
              <h3>{character.name}</h3>
              <p>
                {character.characterClass}
                {character.subclass !== 'Not yet selected'
                  ? ` — ${character.subclass}`
                  : ''}
              </p>
            </div>
            <div>
              <button onClick={() => open(character.id)}>
                Open character →
              </button>
              {character.id !== 'reference' && (
                <button
                  onClick={() => void discard(character.id, character.name)}
                >
                  Delete character
                </button>
              )}
            </div>
          </article>
        ))}
        <Link className="new-card" to="/characters/new">
          <span className="plus">+</span>
          <span>
            <strong>Create Character</strong>
            <small>Druid levels 1–8 · draft saved in this browser</small>
          </span>
        </Link>
      </section>
    </main>
  );
}
