import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CharacterRecord } from '../application/characters/character-repository';
import { useCharacter } from '../app/CharacterContext';
import {
  applyLevelUp,
  previewLevelUp,
  type LevelUpDraft,
} from '../domain/leveling';
import { defaultRuleRegistry } from '../domain/rules';
import { LocalCharacterRepository } from '../infrastructure/persistence/local-character-repository';
import { toCharacterViewModel } from '../features/characters/toCharacterViewModel';
const repo = new LocalCharacterRepository(localStorage);
export function LevelUpPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { update } = useCharacter();
  const [record, setRecord] = useState<CharacterRecord | null>();
  const [landType, setLandType] = useState<
    'arid' | 'polar' | 'temperate' | 'tropical'
  >('temperate');
  useEffect(() => {
    void repo.get(id).then(setRecord);
  }, [id]);
  if (record === undefined)
    return (
      <main className="center-page">
        <p>Loading…</p>
      </main>
    );
  if (!record)
    return (
      <main className="center-page">
        <h1>Level-up unavailable</h1>
        <p>The reference fixture and missing characters cannot level up.</p>
        <Link to="/characters">Return to characters</Link>
      </main>
    );
  if (record.build.totalLevel >= 8)
    return (
      <main className="center-page">
        <h1>Maximum level reached</h1>
        <p>Level 8 is the maximum supported level.</p>
        <Link to={`/character/${id}`}>Return to character</Link>
      </main>
    );
  const toLevel = record.build.totalLevel + 1;
  const progression = defaultRuleRegistry.classes.druid.progression.find(
    (p) => p.level === toLevel,
  )!;
  const prepared = [...(record.build.preparedSpellIds ?? [])];
  const candidates = Object.values(defaultRuleRegistry.spells)
    .filter(
      (s) =>
        s.level > 0 &&
        s.classIds.includes('druid') &&
        s.level <= Math.max(...Object.keys(progression.spellSlots).map(Number)),
    )
    .map((s) => s.id);
  while (prepared.length < progression.preparedSpells) {
    const next = candidates.find((x) => !prepared.includes(x));
    if (!next) break;
    prepared.push(next);
  }
  const selectedCantripIds = [...(record.build.cantripIds ?? [])];
  const cantripCandidates = Object.values(defaultRuleRegistry.spells)
    .filter((spell) => spell.level === 0 && spell.classIds.includes('druid'))
    .map((spell) => spell.id);
  while (selectedCantripIds.length < progression.cantripsKnown) {
    const next = cantripCandidates.find(
      (candidate) => !selectedCantripIds.includes(candidate),
    );
    if (!next) break;
    selectedCantripIds.push(next);
  }
  const draft: LevelUpDraft = {
    characterId: id,
    fromLevel: record.build.totalLevel,
    toLevel,
    hitPointChoice: { type: 'fixed', baseHitPoints: 5 },
    selectedCantripIds,
    selectedPreparedSpellIds: prepared,
    ...(toLevel === 3 ? { subclassId: 'circle-of-the-land', landType } : {}),
  };
  const preview = previewLevelUp(
    record.build,
    record.session,
    draft,
    defaultRuleRegistry,
  );
  const confirmLevel = async () => {
    const result = applyLevelUp(
      record.build,
      record.session,
      draft,
      defaultRuleRegistry,
    );
    if (!result.success) return;
    const now = new Date().toISOString();
    await repo.save({
      ...record,
      build: result.build,
      session: result.session,
      updatedAt: now,
    });
    update(
      toCharacterViewModel(result.build, result.session, defaultRuleRegistry),
    );
    navigate(`/character/${id}`);
  };
  return (
    <main className="wizard-page">
      <p className="eyebrow">One-level advancement</p>
      <h1>Level up to {toLevel}</h1>
      {toLevel === 3 && (
        <fieldset>
          <legend>Circle of the Land selection</legend>
          {(['arid', 'polar', 'temperate', 'tropical'] as const).map((land) => (
            <label key={land}>
              <input
                type="radio"
                checked={landType === land}
                onChange={() => setLandType(land)}
              />
              {land}
            </label>
          ))}
        </fieldset>
      )}
      <section className="wizard-panel">
        <h2>Preview</h2>
        <p>
          Current HP remains {record.session.currentHp}; leveling does not
          perform a rest.
        </p>
        <dl>
          {preview.changes.map((c) => (
            <div key={c.label}>
              <dt>{c.label}</dt>
              <dd>
                {c.before} → {c.after}
              </dd>
            </div>
          ))}
        </dl>
        {preview.diagnostics.map((d) => (
          <p role="alert" key={d.type}>
            {d.message}
          </p>
        ))}
      </section>
      <div className="wizard-actions">
        <Link className="button" to={`/character/${id}`}>
          Cancel
        </Link>
        <button
          disabled={!!preview.diagnostics.length}
          onClick={() => void confirmLevel()}
        >
          Confirm level up
        </button>
      </div>
    </main>
  );
}
