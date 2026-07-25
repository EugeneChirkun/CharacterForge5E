import { Link, useNavigate } from 'react-router-dom';
import { useCharacter } from '../app/CharacterContext';
export function CharacterListPage() {
  const { character, setMeta } = useCharacter();
  const navigate = useNavigate();
  const open = () => {
    setMeta({ lastCharacterId: character.id });
    navigate('/character/reference');
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
            <p className="eyebrow">Ready for the table</p>
            <h2 id="characters">Your characters</h2>
          </div>
          <span className="count">1 character</span>
        </div>
        <article className="character-card">
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
              {character.characterClass} — {character.subclass}
            </p>
            <div className="tags">
              <span>{character.legacy} Legacy</span>
              <span>{character.landType} land</span>
            </div>
          </div>
          <button onClick={open}>
            Open character <span aria-hidden="true">→</span>
          </button>
        </article>
        <Link className="new-card" to="/character/new">
          <span className="plus">+</span>
          <span>
            <strong>Create a new character</strong>
            <small>Begin a fresh adventuring record</small>
          </span>
        </Link>
      </section>
    </main>
  );
}
