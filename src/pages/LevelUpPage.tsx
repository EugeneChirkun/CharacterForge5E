import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CharacterRecord } from '../application/characters/character-repository';
import { useCharacter } from '../app/CharacterContext';
import {
  applyLevelUp,
  previewLevelUp,
  type LevelUpDraft,
  advancementDefinitions,
} from '../domain/leveling';
import type { AbilityName } from '../domain/abilities';
import {
  defaultRuleRegistry,
  SUPPORTED_DRUID_LEVEL_RANGE,
} from '../domain/rules';
import {
  getAvailableClassCantrips,
  getAvailableClassSpells,
} from '../domain/spells';
import { LocalCharacterRepository } from '../infrastructure/persistence/local-character-repository';
import { toCharacterViewModel } from '../features/characters/toCharacterViewModel';
import {
  listGeneralFeatAvailability,
  generalFeatRegistry,
  type FeatNestedChoices,
  evaluateChoiceDefinition,
  reconcileFeatChoices,
} from '../domain/feats';
import { CIRCLE_OF_THE_LAND_ID } from '../domain/subclasses';
import { SpellCard } from '../components/SpellCard';
import { createSpellDetailView } from '../application/spells/spell-detail-view';
import { createPreparationDraft, togglePreparationDraft } from '../application/spells/spell-preparation-draft';
const repo = new LocalCharacterRepository(localStorage);
export function LevelUpPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { update } = useCharacter();
  const [record, setRecord] = useState<CharacterRecord | null>();
  const [landType, setLandType] = useState<
    'arid' | 'polar' | 'temperate' | 'tropical'
  >('temperate');
  const [advancementType, setAdvancementType] = useState<
    'ability-score-improvement' | 'general-feat'
  >('ability-score-improvement');
  const [primaryAbility, setPrimaryAbility] = useState<AbilityName>('wisdom');
  const [splitAbility, setSplitAbility] = useState<AbilityName | ''>('');
  const [subclassConfirmed, setSubclassConfirmed] = useState(false);
  const [featId, setFeatId] = useState('resilient');
  const [featChoices, setFeatChoices] = useState<FeatNestedChoices>({
    ability: 'constitution',
    savingThrow: 'constitution',
  });
  const [preparedIds, setPreparedIds] = useState<readonly string[]>();
  const [preparationReview, setPreparationReview] = useState(false);
  const [spellError, setSpellError] = useState('');
  useEffect(() => {
    void repo.get(id).then((loadedRecord) => {
      setRecord(loadedRecord);
      setPreparedIds(
        loadedRecord
          ? createPreparationDraft(loadedRecord.build.preparedSpellIds ?? [])
              .preparedDruidSpellIds
          : [],
      );
    });
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
  if (record.build.totalLevel >= SUPPORTED_DRUID_LEVEL_RANGE.maximum)
    return (
      <main className="center-page">
        <h1>Maximum level reached</h1>
        <p>
          Level {SUPPORTED_DRUID_LEVEL_RANGE.maximum} is the maximum supported
          level.
        </p>
        <Link to={`/character/${id}`}>Return to character</Link>
      </main>
    );
  const toLevel = record.build.totalLevel + 1;
  const advancementRequired = advancementDefinitions.some(
    (definition) =>
      definition.classId === record.build.class?.classId &&
      definition.characterLevel === toLevel,
  );
  const progression = defaultRuleRegistry.classes.druid.progression.find(
    (p) => p.level === toLevel,
  )!;
  const prepared = [...(preparedIds ?? record.build.preparedSpellIds ?? [])];
  const spellSelectorInput = {
    classId: 'druid',
    characterLevel: toLevel,
    registry: defaultRuleRegistry,
  };
  const candidates = getAvailableClassSpells(spellSelectorInput)
    .filter((spell) => spell.level > 0);
  const selectedCantripIds = [...(record.build.cantripIds ?? [])];
  const cantripCandidates = getAvailableClassCantrips(spellSelectorInput).map(
    (spell) => spell.id,
  );
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
    ...(toLevel === 3 && subclassConfirmed
      ? { subclassId: CIRCLE_OF_THE_LAND_ID, landType }
      : {}),
    ...(advancementRequired
      ? {
          advancementChoice:
            advancementType === 'general-feat'
              ? {
                  type: 'general-feat' as const,
                  featId,
                  selections: featChoices,
                }
              : {
                  type: 'ability-score-improvement' as const,
                  increases: splitAbility
                    ? [
                        { ability: primaryAbility, amount: 1 as const },
                        { ability: splitAbility, amount: 1 as const },
                      ]
                    : [{ ability: primaryAbility, amount: 2 as const }],
                },
        }
      : {}),
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
          <legend>Choose Druid subclass</legend>
          <p>
            Circle of the Land is the only Druid subclass installed in the
            current rules package.
          </p>
          <label>
            <input
              type="checkbox"
              checked={subclassConfirmed}
              onChange={(event) =>
                setSubclassConfirmed(event.currentTarget.checked)
              }
            />{' '}
            Confirm Circle of the Land as the permanent subclass
          </label>
          <h2>Initial Circle Land</h2>
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
      {advancementRequired && (
        <fieldset>
          <legend>Advancement choice</legend>
          <label>
            <input
              type="radio"
              checked={advancementType === 'ability-score-improvement'}
              onChange={() => setAdvancementType('ability-score-improvement')}
            />{' '}
            Ability Score Improvement
          </label>
          <label>
            <input
              type="radio"
              checked={advancementType === 'general-feat'}
              onChange={() => setAdvancementType('general-feat')}
            />{' '}
            General Feat
          </label>
          {advancementType === 'ability-score-improvement' ? (
            <>
              <label>
                Primary ability{' '}
                <select
                  value={primaryAbility}
                  onChange={(event) =>
                    setPrimaryAbility(event.currentTarget.value as AbilityName)
                  }
                >
                  {Object.keys(record.build.abilityScores).map((ability) => (
                    <option key={ability}>{ability}</option>
                  ))}
                </select>
              </label>
              <label>
                Split +1 / +1 (optional){' '}
                <select
                  value={splitAbility}
                  onChange={(event) =>
                    setSplitAbility(
                      event.currentTarget.value as AbilityName | '',
                    )
                  }
                >
                  <option value="">Use +2</option>
                  {Object.keys(record.build.abilityScores)
                    .filter((ability) => ability !== primaryAbility)
                    .map((ability) => (
                      <option key={ability}>{ability}</option>
                    ))}
                </select>
              </label>
            </>
          ) : (
            <FeatSelector
              build={record.build}
              level={toLevel}
              featId={featId}
              choices={featChoices}
              onFeat={setFeatId}
              onChoices={setFeatChoices}
            />
          )}
        </fieldset>
      )}
      <section className="wizard-panel">
        <h2>Spellcasting changes</h2>
        <p><strong>Prepared spell limit:</strong> {defaultRuleRegistry.classes.druid.progression.find((p) => p.level === record.build.totalLevel)?.preparedSpells ?? 0} → {progression.preparedSpells}</p>
        <p><strong>Maximum spell level:</strong> {Math.max(...Object.keys(defaultRuleRegistry.classes.druid.progression.find((p) => p.level === record.build.totalLevel)?.spellSlots ?? {}).map(Number))} → {Math.max(...Object.keys(progression.spellSlots).map(Number))}</p>
        {!preparationReview && <button type="button" onClick={() => setPreparationReview(true)}>Continue to Spell Preparation</button>}
      </section>
      {preparationReview && <section className="wizard-panel">
        <h2>Prepare Druid Spells</h2>
        <p><strong>{prepared.length} / {progression.preparedSpells} prepared</strong></p>
        <p>Existing choices are preserved. You may finish below the limit.</p>
        <div className="rich-spell-list">{candidates.map((spell) => <SpellCard key={spell.id} spell={createSpellDetailView(spell)} selected={prepared.includes(spell.id)} actionLabel="Prepare" onToggle={() => {
          const result = togglePreparationDraft(createPreparationDraft(prepared), spell.id, toLevel, defaultRuleRegistry);
          setSpellError(result.diagnostics[0]?.message ?? '');
          setPreparedIds(result.draft.preparedDruidSpellIds);
        }} />)}</div>
        {spellError && <p role="alert">{spellError}</p>}
        <p><strong>Always Prepared:</strong> Circle of the Land spells and <strong>Granted:</strong> species spells remain derived, read-only, and outside this count.</p>
      </section>}
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
          disabled={!preparationReview || !!preview.diagnostics.length}
          onClick={() => void confirmLevel()}
        >
          Confirm level up
        </button>
      </div>
    </main>
  );
}

function FeatSelector({
  build,
  level,
  featId,
  choices,
  onFeat,
  onChoices,
}: {
  build: CharacterRecord['build'];
  level: number;
  featId: string;
  choices: FeatNestedChoices;
  onFeat: (id: string) => void;
  onChoices: (choices: FeatNestedChoices) => void;
}) {
  const entries = listGeneralFeatAvailability(build, level);
  const available = entries.filter(
    (entry) => entry.availability.status === 'available',
  );
  const unavailable = entries.filter(
    (entry) => entry.availability.status === 'unavailable',
  );
  const definition = generalFeatRegistry[featId];
  return (
    <div className="feat-selector">
      <h2>Available Feats</h2>
      {available.map(({ definition: feat }) => (
        <label key={feat.id}>
          <input
            type="radio"
            name="general-feat"
            checked={featId === feat.id}
            onChange={() => {
              onFeat(feat.id);
              onChoices({});
            }}
          />{' '}
          <strong>{feat.name}</strong> — {feat.summary}
        </label>
      ))}
      {definition?.choices.map((choice) => {
        const result = evaluateChoiceDefinition(choice, {
          build,
          selections: choices,
        });
        return (
          <label key={choice.id}>
            {choice.type.replaceAll('-', ' ')}{' '}
            <select
              aria-label={choice.type}
              value={result.selectedValue ?? ''}
              onChange={(event) => {
                const candidate = {
                  ...choices,
                  [choice.id]: event.currentTarget.value || undefined,
                };
                onChoices(
                  reconcileFeatChoices(definition.choices, build, candidate)
                    .choices,
                );
              }}
            >
              <option value="">Choose…</option>
              {result.options
                .filter((option) => option.visible)
                .map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                    disabled={!option.enabled}
                  >
                    {option.label}
                  </option>
                ))}
            </select>
            {result.clearedReason && (
              <small role="status">{result.clearedReason}</small>
            )}
          </label>
        );
      })}
      <h2>Unavailable Feats</h2>
      {unavailable.map(({ definition: feat, availability }) => (
        <div key={feat.id} aria-disabled="true">
          <strong>{feat.name}</strong>
          <p>
            {availability.status === 'unavailable' ? availability.message : ''}
          </p>
        </div>
      ))}
    </div>
  );
}
