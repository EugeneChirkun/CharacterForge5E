import { Link, useNavigate } from 'react-router-dom';
import { useCharacter } from '../app/CharacterContext';
import { LocalCharacterRepository } from '../infrastructure/persistence/local-character-repository';
import { duplicateCharacter } from '../application/characters/character-management';
import {
  createBackup,
  backupFilename,
  serializeBackup,
} from '../application/backup/backup-controller';
import { downloadJson } from '../infrastructure/persistence/backup-file-adapter';
import { applicationImplementationStatus } from '../application/implementation-status/implementation-status';
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
      <nav className="page-actions" aria-label="Application">
        <Link className="button secondary" to="/settings">
          Settings
        </Link>
      </nav>
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
                <>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      void repository
                        .get(character.id)
                        .then(
                          (record) =>
                            record && duplicateCharacter(record, repository),
                        )
                        .then(() => location.reload())
                    }
                  >
                    Duplicate character
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      void repository.get(character.id).then((record) => {
                        if (record)
                          downloadJson(
                            serializeBackup(createBackup([record])),
                            backupFilename(character.name),
                          );
                      })
                    }
                  >
                    Export character
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void discard(character.id, character.name)}
                  >
                    Delete character
                  </button>
                </>
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
      <details className="implementation-status" open>
        <summary>
          <span>Implementation Status</span>
          <small>
            Stage {applicationImplementationStatus.stage} · Iteration{' '}
            {applicationImplementationStatus.iteration}
          </small>
        </summary>
        <div className="implementation-status-content">
          <dl>
            <div>
              <dt>Stage</dt>
              <dd>{applicationImplementationStatus.stage}</dd>
            </div>
            <div>
              <dt>Iteration</dt>
              <dd>{applicationImplementationStatus.iteration}</dd>
            </div>
          </dl>
          <h2>{applicationImplementationStatus.title}</h2>
          <p>{applicationImplementationStatus.summary}</p>
          <h3>Implemented features</h3>
          <ul>
            {applicationImplementationStatus.implementedFeatures.map(
              (feature) => (
                <li key={feature}>{feature}</li>
              ),
            )}
          </ul>
        </div>
      </details>
    </main>
  );
}
