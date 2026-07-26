import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { abilityNames, type AbilityName } from '../domain/abilities';
import {
  createCharacterFromDraft,
  finalAbilityScores,
  newCharacterDraft,
  type CharacterDraft,
} from '../domain/creation';
import { defaultRuleRegistry } from '../domain/rules';
import {
  getAvailableClassCantrips,
  getAvailableClassSpells,
} from '../domain/spells';
import {
  LocalCharacterDraftRepository,
  LocalCharacterRepository,
} from '../infrastructure/persistence/local-character-repository';
import { useCharacter } from '../app/CharacterContext';
import { toCharacterViewModel } from '../features/characters/toCharacterViewModel';
import { equipmentRegistry } from '../domain/equipment';
const steps = [
  'Basics',
  'Origin',
  'Abilities',
  'Skills',
  'Primal Order',
  'Equipment',
  'Spells',
  'Subclass',
  'Review',
] as const;
const draftRepo = new LocalCharacterDraftRepository(localStorage);
const characterRepo = new LocalCharacterRepository(localStorage);
const label = (value: string) =>
  value.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase());
export function NewCharacterPage() {
  const navigate = useNavigate();
  const { update } = useCharacter();
  const [draft, setDraft] = useState<CharacterDraft>(() => newCharacterDraft());
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<readonly string[]>([]);
  useEffect(() => {
    void draftRepo.loadDraft().then((saved) => {
      if (saved) setDraft(saved);
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) void draftRepo.saveDraft(draft);
  }, [draft, loaded]);
  const classRule = defaultRuleRegistry.classes.druid;
  const progression = classRule.progression.find(
    (p) => p.level === draft.targetLevel,
  )!;
  const visibleSteps = steps.filter(
    (s) =>
      s !== 'Subclass' || draft.targetLevel >= classRule.subclassUnlockLevel,
  );
  const current = visibleSteps[Math.min(step, visibleSteps.length - 1)];
  const patch = (value: Partial<CharacterDraft>) =>
    setDraft((d) => ({ ...d, ...value }));
  const scores = finalAbilityScores(draft);
  const spellSelectorInput = {
    classId: classRule.id,
    characterLevel: draft.targetLevel,
    registry: defaultRuleRegistry,
  };
  const cantrips = getAvailableClassCantrips(spellSelectorInput);
  const leveled = getAvailableClassSpells(spellSelectorInput).filter(
    (spell) => spell.level > 0,
  );
  const preview = useMemo(() => {
    const result = createCharacterFromDraft(draft, defaultRuleRegistry);
    return result.success
      ? toCharacterViewModel(result.build, result.session, defaultRuleRegistry)
      : null;
  }, [draft]);
  const next = () => {
    setErrors([]);
    if (
      current === 'Basics' &&
      (!draft.name.trim() || draft.targetLevel < 1 || draft.targetLevel > 8)
    )
      return setErrors(['Enter a name and a level from 1 to 8.']);
    setStep((n) => Math.min(n + 1, visibleSteps.length - 1));
  };
  const finish = async () => {
    const result = createCharacterFromDraft(draft, defaultRuleRegistry);
    if (!result.success)
      return setErrors(result.diagnostics.map((d) => d.message));
    const now = new Date().toISOString();
    await characterRepo.save({
      schemaVersion: 2,
      build: result.build,
      session: result.session,
      createdAt: now,
      updatedAt: now,
    });
    update(
      toCharacterViewModel(result.build, result.session, defaultRuleRegistry),
    );
    await draftRepo.deleteDraft();
    navigate(`/character/${result.build.id}`);
  };
  const cancel = () => {
    if (confirm('Discard this saved creation draft?')) {
      void draftRepo.deleteDraft();
      navigate('/characters');
    }
  };
  const toggle = <T extends string>(values: readonly T[], value: T) =>
    values.includes(value)
      ? values.filter((x) => x !== value)
      : [...values, value];
  return (
    <main className="wizard-page">
      <header>
        <p className="eyebrow">Druid MVP · levels 1–8</p>
        <h1 tabIndex={-1}>Create a character</h1>
        <p>
          Only Druid, Tiefling (Chthonic), Farmer, Tough, and Circle of the Land
          are supported.
        </p>
      </header>
      <nav aria-label="Creation progress">
        <ol className="wizard-progress">
          {visibleSteps.map((s, i) => (
            <li key={s} aria-current={i === step ? 'step' : undefined}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </nav>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (current === 'Review') void finish();
          else next();
        }}
      >
        <section className="wizard-panel">
          <h2>{current}</h2>
          {current === 'Basics' && (
            <>
              <label htmlFor="character-name">Character name</label>
              <input
                id="character-name"
                maxLength={80}
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <label htmlFor="level">Starting level</label>
              <input
                id="level"
                type="number"
                min="1"
                max="8"
                value={draft.targetLevel}
                onChange={(e) => {
                  const targetLevel = Number(e.target.value);
                  const hitPointChoices = Object.fromEntries(
                    Array.from({ length: Math.max(0, targetLevel) }, (_, i) => [
                      i + 1,
                      { type: 'fixed' as const, baseHitPoints: i ? 5 : 8 },
                    ]),
                  );
                  patch({
                    targetLevel,
                    hitPointChoices,
                    ...(targetLevel < 3
                      ? { subclassId: undefined, landType: undefined }
                      : {}),
                  });
                }}
              />
              <aside>
                <strong>Druid</strong> · d8 Hit Die · Wisdom · Intelligence and
                Wisdom saves. Spellcasting and features come from the verified
                progression.
              </aside>
            </>
          )}
          {current === 'Origin' && (
            <dl>
              <dt>Species</dt>
              <dd>
                Tiefling — Chthonic Legacy; legacy spells unlock with level.
              </dd>
              <dt>Background</dt>
              <dd>Farmer — Animal Handling, Nature, and Tough.</dd>
              <dt>Equipment</dt>
              <dd>One verified MVP preset is available.</dd>
            </dl>
          )}
          {current === 'Abilities' && (
            <>
              <fieldset>
                <legend>Generation method</legend>
                {(['standard-array', 'point-buy', 'manual'] as const).map(
                  (m) => (
                    <label key={m}>
                      <input
                        type="radio"
                        checked={draft.abilityGenerationMethod === m}
                        onChange={() =>
                          patch({
                            abilityGenerationMethod: m,
                            baseAbilityScores: draft.methodScores[m],
                          })
                        }
                      />
                      {label(m)}
                    </label>
                  ),
                )}
              </fieldset>
              <div className="ability-grid">
                {abilityNames.map((a) => (
                  <label key={a}>
                    {label(a)}
                    <input
                      type="number"
                      min="8"
                      max="15"
                      value={draft.baseAbilityScores[a] ?? ''}
                      onChange={(e) => {
                        const baseAbilityScores = {
                          ...draft.baseAbilityScores,
                          [a]: Number(e.target.value),
                        };
                        patch({
                          baseAbilityScores,
                          methodScores: {
                            ...draft.methodScores,
                            [draft.abilityGenerationMethod]: baseAbilityScores,
                          },
                        });
                      }}
                    />
                    <small>Final: {scores?.[a] ?? '—'}</small>
                  </label>
                ))}
              </div>
              <fieldset>
                <legend>Farmer adjustments (+3)</legend>
                {(['strength', 'constitution', 'wisdom'] as AbilityName[]).map(
                  (a) => (
                    <label key={a}>
                      {label(a)}{' '}
                      <select
                        value={draft.backgroundAbilityAdjustments[a] ?? 0}
                        onChange={(e) =>
                          patch({
                            backgroundAbilityAdjustments: {
                              ...draft.backgroundAbilityAdjustments,
                              [a]: Number(e.target.value),
                            },
                          })
                        }
                      >
                        <option value="0">+0</option>
                        <option value="1">+1</option>
                        <option value="2">+2</option>
                      </select>
                    </label>
                  ),
                )}
              </fieldset>
            </>
          )}
          {current === 'Skills' && (
            <>
              <p>
                Farmer grants Animal Handling and Nature. Choose exactly two
                other Druid skills.
              </p>
              <fieldset>
                <legend>
                  Druid skills ({draft.selectedSkillProficiencies.length}/2)
                </legend>
                {classRule.availableSkills
                  .filter(
                    (s) =>
                      !defaultRuleRegistry.backgrounds.farmer.skills.includes(
                        s,
                      ),
                  )
                  .map((s) => (
                    <label key={s}>
                      <input
                        type="checkbox"
                        checked={draft.selectedSkillProficiencies.includes(s)}
                        onChange={() =>
                          patch({
                            selectedSkillProficiencies: toggle(
                              draft.selectedSkillProficiencies,
                              s,
                            ),
                          })
                        }
                      />
                      {label(s)}
                    </label>
                  ))}
              </fieldset>
            </>
          )}
          {current === 'Equipment' && (
            <fieldset>
              <legend>Supported starting equipment</legend>
              <label>
                <input
                  type="checkbox"
                  checked={draft.equipmentChoiceIds.includes(
                    'druid-farmer-preset',
                  )}
                  onChange={() =>
                    patch({
                      equipmentChoiceIds: toggle(
                        draft.equipmentChoiceIds,
                        'druid-farmer-preset',
                      ),
                    })
                  }
                />
                Druid & Farmer MVP preset (starting armor, shield, and verified
                essentials)
              </label>
            </fieldset>
          )}
          {current === 'Primal Order' && (
            <>
              <p>Choose the permanent role learned by your Druid at level 1.</p>
              <fieldset>
                <legend>Primal Order (required)</legend>
                {Object.values(defaultRuleRegistry.druidPrimalOrders).map((order) => (
                  <label key={order.id}>
                    <input type="radio" checked={draft.primalOrder?.orderId === order.id}
                      onChange={() => patch({ primalOrder: order.id === 'warden' ? { orderId: 'warden' } : { orderId: 'magician' } })} />
                    {order.name} — {order.id === 'magician' ? 'an additional cantrip and Wisdom-based skill bonus' : 'medium armor and martial weapons'}
                  </label>
                ))}
              </fieldset>
              {draft.primalOrder?.orderId === 'magician' && <>
                <label>Additional Druid cantrip
                  <select value={draft.primalOrder.magicianChoices?.additionalCantripId ?? ''} onChange={(e) => patch({ primalOrder: { orderId: 'magician', magicianChoices: { additionalCantripId: e.target.value, skillBonusTarget: draft.primalOrder?.orderId === 'magician' ? draft.primalOrder.magicianChoices?.skillBonusTarget ?? 'arcana' : 'arcana' } } })}>
                    <option value="">Choose a cantrip</option>
                    {cantrips.filter((s) => !draft.selectedCantripIds.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <fieldset><legend>Skill bonus</legend>{(['arcana', 'nature'] as const).map((skill) => <label key={skill}><input type="radio" checked={draft.primalOrder?.orderId === 'magician' && draft.primalOrder.magicianChoices?.skillBonusTarget === skill} onChange={() => patch({ primalOrder: { orderId: 'magician', magicianChoices: { additionalCantripId: draft.primalOrder?.orderId === 'magician' ? draft.primalOrder.magicianChoices?.additionalCantripId ?? '' : '', skillBonusTarget: skill } } })} />{label(skill)}</label>)}</fieldset>
              </>}
            </>
          )}
          {current === 'Spells' && (
            <>
              <fieldset>
                <legend>
                  Druid cantrips ({draft.selectedCantripIds.length}/
                  {progression.cantripsKnown})
                </legend>
                {cantrips.map((s) => (
                  <label key={s.id}>
                    <input
                      type="checkbox"
                      checked={draft.selectedCantripIds.includes(s.id)}
                      onChange={() =>
                        patch({
                          selectedCantripIds: toggle(
                            draft.selectedCantripIds,
                            s.id,
                          ),
                        })
                      }
                    />
                    {s.name}
                    {s.concentration ? ' · Concentration' : ''}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>
                  Prepared spells ({draft.selectedPreparedSpellIds.length}/
                  {progression.preparedSpells})
                </legend>
                {leveled.map((s) => (
                  <label key={s.id}>
                    <input
                      type="checkbox"
                      checked={draft.selectedPreparedSpellIds.includes(s.id)}
                      onChange={() =>
                        patch({
                          selectedPreparedSpellIds: toggle(
                            draft.selectedPreparedSpellIds,
                            s.id,
                          ),
                        })
                      }
                    />
                    {s.name} · Level {s.level}
                    {s.ritual ? ' · Ritual' : ''}
                    {s.concentration ? ' · Concentration' : ''}
                  </label>
                ))}
              </fieldset>
              <p>
                Circle and Chthonic spells are granted separately and do not
                count against preparation.
              </p>
            </>
          )}
          {current === 'Subclass' && (
            <>
              <p>At level 3, this MVP supports only Circle of the Land.</p>
              <fieldset>
                <legend>Land type</legend>
                {(['arid', 'polar', 'temperate', 'tropical'] as const).map(
                  (land) => (
                    <label key={land}>
                      <input
                        type="radio"
                        checked={draft.landType === land}
                        onChange={() =>
                          patch({
                            subclassId: 'circle-of-the-land',
                            landType: land,
                          })
                        }
                      />
                      {label(land)}
                    </label>
                  ),
                )}
              </fieldset>
            </>
          )}
          {current === 'Review' && (
            <>
              {preview ? (
                <dl>
                  <dt>Name</dt>
                  <dd>{preview.name}</dd>
                  <dt>Origin</dt>
                  <dd>
                    Level {preview.level} Chthonic Tiefling Druid · Farmer ·
                    Tough
                  </dd>
                  <dt>Subclass</dt>
                  <dd>
                    {preview.subclass}
                    {draft.landType ? ` (${label(draft.landType)})` : ''}
                  </dd>
                  <dt>Maximum HP</dt>
                  <dd>{preview.maximumHp}</dd>
                  <dt>Primal Order</dt>
                  <dd>{preview.primalOrder?.name ?? 'Incomplete'}</dd>
                  <dt>Armor Class</dt>
                  <dd>{preview.armorClass}</dd>
                  <dt>Spell save DC / attack</dt>
                  <dd>
                    {preview.spellSaveDc} / +{preview.spellAttackBonus}
                  </dd>
                  <dt>Spells</dt>
                  <dd>{preview.spells.map((s) => s.name).join(', ')}</dd>
                  <dt>Starting equipment</dt>
                  <dd>
                    {preview.inventory.items
                      .map(
                        (item) =>
                          `${equipmentRegistry[item.definitionId]?.name ?? item.definitionId}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`,
                      )
                      .join(', ')}
                  </dd>
                </dl>
              ) : (
                <p>Complete all choices to generate the computed review.</p>
              )}
            </>
          )}
          {!!errors.length && (
            <div role="alert" id="wizard-errors">
              <strong>Resolve these issues:</strong>
              <ul>
                {errors.map((e, i) => (
                  <li key={`${e}-${i}`}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <div className="wizard-actions">
          <button type="button" onClick={cancel}>
            Cancel creation
          </button>
          {step > 0 && (
            <button type="button" onClick={() => setStep((n) => n - 1)}>
              Back
            </button>
          )}
          <button type="submit">
            {current === 'Review' ? 'Create character' : 'Next'}
          </button>
        </div>
      </form>
    </main>
  );
}
