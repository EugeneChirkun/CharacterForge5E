import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { abilityNames, type AbilityName } from '../domain/abilities';
import {
  createCharacterFromDraft,
  finalAbilityScores,
  newCharacterDraft,
  type CharacterDraft,
} from '../domain/creation';
import {
  defaultRuleRegistry,
  SUPPORTED_DRUID_LEVEL_RANGE,
} from '../domain/rules';
import { getResolvedCantripSelections } from '../domain/rules';
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
import {
  addStartingPurchaseItem,
  clearStartingPurchaseCart,
  equipmentProficiencyWarning,
  getPurchasableStartingEquipment,
  removeStartingPurchaseItem,
  resolveStartingChoices,
  setStartingPurchaseQuantity,
  summarizeStartingPurchase,
  type StartingEquipmentSourceId,
  equipmentPackageRegistry,
  findPackageDuplicateWarning,
} from '../domain/equipment';
import { computeCharacter } from '../domain/character';
import { createCantripSelectionView } from '../application/characters/cantrip-selection-view';
import { CartRow } from '../components/CartRow';
import { EquipmentPackageViewer } from '../components/EquipmentPackageViewer';
import { EquipmentMechanicalSummary } from '../components/EquipmentMechanicalSummary';
const steps = [
  'Basics',
  'Origin',
  'Abilities',
  'Skills',
  'Primal Order',
  'Equipment',
  'Spells',
  'Subclass',
  'Advancement',
  'Review',
] as const;
const draftRepo = new LocalCharacterDraftRepository(localStorage);
const characterRepo = new LocalCharacterRepository(localStorage);
const label = (value: string) =>
  value.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase());
const formatWallet = (wallet: {
  readonly cp: number;
  readonly sp: number;
  readonly ep: number;
  readonly gp: number;
  readonly pp: number;
}) =>
  (['pp', 'gp', 'ep', 'sp', 'cp'] as const)
    .filter((denomination) => wallet[denomination] > 0)
    .map(
      (denomination) => `${wallet[denomination]} ${denomination.toUpperCase()}`,
    )
    .join(', ') || '0 GP';
export function NewCharacterPage() {
  const navigate = useNavigate();
  const { update } = useCharacter();
  const [draft, setDraft] = useState<CharacterDraft>(() => newCharacterDraft());
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('all');
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
      (s !== 'Subclass' ||
        draft.targetLevel >= classRule.subclassUnlockLevel) &&
      (s !== 'Advancement' || draft.targetLevel >= 4),
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
  const cantripBuild = {
    cantripIds: draft.selectedCantripIds,
    class: {
      classId: 'druid',
      level: draft.targetLevel,
      primalOrder: draft.primalOrder,
    },
  };
  const resolvedCantrips = getResolvedCantripSelections(cantripBuild);
  const magicianCantripId = resolvedCantrips.find(
    (choice) => choice.source === 'primal-order-magician',
  )?.spellId;
  const cantripView = createCantripSelectionView(
    cantrips,
    draft.selectedCantripIds,
    progression.cantripsKnown,
    magicianCantripId,
  );
  const leveled = getAvailableClassSpells(spellSelectorInput).filter(
    (spell) => spell.level > 0,
  );
  const preview = useMemo(() => {
    const result = createCharacterFromDraft(draft, defaultRuleRegistry);
    return result.success
      ? toCharacterViewModel(result.build, result.session, defaultRuleRegistry)
      : null;
  }, [draft]);
  const equipmentModel = useMemo(() => {
    const resolved = resolveStartingChoices(draft.startingEquipmentChoices);
    const purchaseDraft = {
      sourceWallet: resolved.availableWallet,
      items: draft.startingPurchaseCart,
    };
    const created = createCharacterFromDraft(draft, defaultRuleRegistry);
    const computed = created.success
      ? computeCharacter(created.build, created.session, defaultRuleRegistry)
      : undefined;
    return {
      resolved,
      purchaseDraft,
      summary: summarizeStartingPurchase(purchaseDraft),
      computed,
    };
  }, [draft]);
  const chooseEquipment = (
    sourceId: StartingEquipmentSourceId,
    choiceType: 'package' | 'gold',
  ) =>
    patch({
      startingEquipmentChoices: [
        ...draft.startingEquipmentChoices.filter(
          (choice) => choice.sourceId !== sourceId,
        ),
        { sourceId, choiceType },
      ],
    });
  const applyCartResult = (
    result: ReturnType<typeof addStartingPurchaseItem>,
  ) => {
    if (result.success) patch({ startingPurchaseCart: result.draft.items });
    else setErrors(result.diagnostics.map((entry) => entry.message));
  };
  const next = () => {
    setErrors([]);
    if (
      current === 'Basics' &&
      (!draft.name.trim() ||
        draft.targetLevel < SUPPORTED_DRUID_LEVEL_RANGE.minimum ||
        draft.targetLevel > SUPPORTED_DRUID_LEVEL_RANGE.maximum)
    )
      return setErrors([
        `Enter a name and a level from ${SUPPORTED_DRUID_LEVEL_RANGE.minimum} to ${SUPPORTED_DRUID_LEVEL_RANGE.maximum}.`,
      ]);
    setStep((n) => Math.min(n + 1, visibleSteps.length - 1));
  };
  const finish = async () => {
    const result = createCharacterFromDraft(draft, defaultRuleRegistry);
    if (!result.success)
      return setErrors(result.diagnostics.map((d) => d.message));
    const now = new Date().toISOString();
    await characterRepo.save({
      schemaVersion: 3,
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
        <p className="eyebrow">Druid MVP · levels 1–9</p>
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
                max={SUPPORTED_DRUID_LEVEL_RANGE.maximum}
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
                    advancementChoices: draft.advancementChoices.filter(
                      (choice) => choice.characterLevel <= targetLevel,
                    ),
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
            <div className="starting-equipment-builder">
              {(
                [
                  [
                    'druid.class.starting-equipment',
                    'Class Equipment',
                    'Druid package (includes 9 GP)',
                    'Take 50 GP',
                  ],
                  [
                    'farmer.background.starting-equipment',
                    'Background Equipment',
                    'Farmer package (includes 30 GP)',
                    'Take 50 GP',
                  ],
                ] as const
              ).map(([sourceId, legend, packageLabel, goldLabel]) => (
                <fieldset key={sourceId}>
                  <legend>{legend}</legend>
                  <label>
                    <input
                      type="radio"
                      name={sourceId}
                      checked={draft.startingEquipmentChoices.some(
                        (choice) =>
                          choice.sourceId === sourceId &&
                          choice.choiceType === 'package',
                      )}
                      onChange={() => chooseEquipment(sourceId, 'package')}
                    />
                    {packageLabel}
                  </label>
                  {sourceId === 'druid.class.starting-equipment' && (
                    <EquipmentPackageViewer
                      definition={equipmentPackageRegistry['explorers-pack']}
                    />
                  )}
                  <label>
                    <input
                      type="radio"
                      name={sourceId}
                      checked={draft.startingEquipmentChoices.some(
                        (choice) =>
                          choice.sourceId === sourceId &&
                          choice.choiceType === 'gold',
                      )}
                      onChange={() => chooseEquipment(sourceId, 'gold')}
                    />
                    {goldLabel}
                  </label>
                </fieldset>
              ))}
              <section aria-labelledby="starting-funds">
                <h3 id="starting-funds">Starting Funds</h3>
                <p>
                  {formatWallet(equipmentModel.summary.availableWallet)}{' '}
                  available ·{' '}
                  {formatWallet(equipmentModel.summary.cartTotalWallet)} spent ·{' '}
                  {formatWallet(equipmentModel.summary.remainingWallet)}{' '}
                  remaining
                </p>
              </section>
              {equipmentModel.summary.availableCopperValue > 0 && (
                <div className="starting-shop">
                  <section>
                    <h3>Purchase Equipment</h3>
                    <label htmlFor="equipment-search">Search equipment</label>
                    <input
                      id="equipment-search"
                      type="search"
                      value={equipmentSearch}
                      onChange={(event) =>
                        setEquipmentSearch(event.target.value)
                      }
                    />
                    <label htmlFor="equipment-category">
                      Equipment category
                    </label>
                    <select
                      id="equipment-category"
                      value={equipmentCategory}
                      onChange={(event) =>
                        setEquipmentCategory(event.target.value)
                      }
                    >
                      <option value="all">All categories</option>
                      {[
                        'armor',
                        'shield',
                        'weapon',
                        'tool',
                        'adventuring-gear',
                        'container',
                        'spellcasting-focus',
                      ].map((category) => (
                        <option key={category} value={category}>
                          {label(category)}
                        </option>
                      ))}
                    </select>
                    <ul className="shop-list">
                      {getPurchasableStartingEquipment()
                        .filter(
                          (definition) =>
                            definition.name
                              .toLowerCase()
                              .includes(equipmentSearch.trim().toLowerCase()) &&
                            (equipmentCategory === 'all' ||
                              definition.category === equipmentCategory),
                        )
                        .map((definition) => {
                          const warning = equipmentModel.computed
                            ? equipmentProficiencyWarning(
                                definition,
                                equipmentModel.computed.proficiencies,
                              )
                            : undefined;
                          return (
                            <li key={definition.id}>
                              <span>
                                <strong>{definition.name}</strong>
                                <small>
                                  {definition.category} ·{' '}
                                  {(definition.priceCopper ?? 0) / 100} GP ·{' '}
                                  {definition.weight ?? '—'} lb
                                </small>
                                <EquipmentMechanicalSummary
                                  definition={definition}
                                />
                                {draft.startingEquipmentChoices.some(
                                  (choice) =>
                                    choice.sourceId ===
                                      'druid.class.starting-equipment' &&
                                    choice.choiceType === 'package',
                                ) &&
                                  findPackageDuplicateWarning(definition.id, [
                                    'explorers-pack',
                                  ]) && (
                                    <span className="equipment-warning">
                                      {findPackageDuplicateWarning(
                                        definition.id,
                                        ['explorers-pack'],
                                      )}
                                    </span>
                                  )}
                                {warning && (
                                  <span className="equipment-warning">
                                    Warning: {warning}
                                  </span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  applyCartResult(
                                    addStartingPurchaseItem(
                                      equipmentModel.purchaseDraft,
                                      definition.id,
                                    ),
                                  )
                                }
                              >
                                Add {definition.name}
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </section>
                  <section>
                    <h3>Cart</h3>
                    {draft.startingPurchaseCart.length ? (
                      <ul className="cart-list">
                        {draft.startingPurchaseCart.map((row) => {
                          const itemName =
                            equipmentRegistry[row.equipmentDefinitionId]
                              ?.name ?? 'Unknown equipment';
                          return (
                            <CartRow
                              key={row.equipmentDefinitionId}
                              name={itemName}
                              quantity={
                                <label>
                                  Quantity{' '}
                                  <input
                                    aria-label={`Quantity for ${equipmentRegistry[row.equipmentDefinitionId]?.name}`}
                                    type="number"
                                    min="1"
                                    value={row.quantity}
                                    onChange={(event) =>
                                      applyCartResult(
                                        setStartingPurchaseQuantity(
                                          equipmentModel.purchaseDraft,
                                          row.equipmentDefinitionId,
                                          Number(event.target.value),
                                        ),
                                      )
                                    }
                                  />
                                </label>
                              }
                              action={
                                <button
                                  type="button"
                                  className="danger"
                                  aria-label={`Remove ${itemName} from cart`}
                                  onClick={() =>
                                    applyCartResult(
                                      removeStartingPurchaseItem(
                                        equipmentModel.purchaseDraft,
                                        row.equipmentDefinitionId,
                                      ),
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              }
                            />
                          );
                        })}
                      </ul>
                    ) : (
                      <p>No purchases selected. Unspent funds are preserved.</p>
                    )}
                    <button
                      type="button"
                      className="danger"
                      disabled={!draft.startingPurchaseCart.length}
                      onClick={() =>
                        applyCartResult(
                          clearStartingPurchaseCart(
                            equipmentModel.purchaseDraft,
                          ),
                        )
                      }
                    >
                      Clear cart
                    </button>
                    {!equipmentModel.summary.affordable && (
                      <p role="alert" className="equipment-warning">
                        The selected equipment costs more than the available
                        starting funds.
                      </p>
                    )}
                  </section>
                </div>
              )}
              <section>
                <h3>Equipment Review</h3>
                {equipmentModel.resolved.grants.length ? (
                  <ul>
                    {equipmentModel.resolved.grants.map(
                      ({ grant, sourceId }) =>
                        grant.type === 'item' && (
                          <li
                            key={`${sourceId}-${grant.equipmentDefinitionId}`}
                          >
                            {
                              equipmentRegistry[grant.equipmentDefinitionId]
                                ?.name
                            }{' '}
                            ·{' '}
                            {sourceId.startsWith('druid')
                              ? 'Druid package'
                              : 'Farmer package'}{' '}
                            ·{' '}
                            {grant.equipPolicy === 'equipped'
                              ? 'Equipped'
                              : 'Carried'}
                          </li>
                        ),
                    )}
                  </ul>
                ) : (
                  <p>No package items selected.</p>
                )}
                <p>
                  <strong>Armor Class preview:</strong>{' '}
                  {preview?.armorClass ?? 'Complete required choices'}
                </p>
              </section>
            </div>
          )}
          {current === 'Primal Order' && (
            <>
              <p>Choose the permanent role learned by your Druid at level 1.</p>
              <fieldset>
                <legend>Primal Order (required)</legend>
                {Object.values(defaultRuleRegistry.druidPrimalOrders).map(
                  (order) => (
                    <label key={order.id}>
                      <input
                        type="radio"
                        checked={draft.primalOrder?.orderId === order.id}
                        onChange={() =>
                          patch({
                            primalOrder:
                              order.id === 'warden'
                                ? { orderId: 'warden' }
                                : { orderId: 'magician' },
                          })
                        }
                      />
                      {order.name} —{' '}
                      {order.id === 'magician'
                        ? 'an additional cantrip and Wisdom-based skill bonus'
                        : 'medium armor and martial weapons'}
                    </label>
                  ),
                )}
              </fieldset>
              {draft.primalOrder?.orderId === 'magician' && (
                <>
                  <label>
                    Additional Druid cantrip
                    <select
                      value={
                        draft.primalOrder.magicianChoices
                          ?.additionalCantripId ?? ''
                      }
                      onChange={(e) =>
                        patch({
                          primalOrder: {
                            orderId: 'magician',
                            magicianChoices: {
                              additionalCantripId: e.target.value,
                              skillBonusTarget:
                                draft.primalOrder?.orderId === 'magician'
                                  ? (draft.primalOrder.magicianChoices
                                      ?.skillBonusTarget ?? 'arcana')
                                  : 'arcana',
                            },
                          },
                        })
                      }
                    >
                      <option value="">Choose a cantrip</option>
                      {cantrips.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={draft.selectedCantripIds.includes(s.id)}
                        >
                          {s.name}
                          {draft.selectedCantripIds.includes(s.id)
                            ? ' — already selected as a Druid cantrip'
                            : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset>
                    <legend>Skill bonus</legend>
                    {(['arcana', 'nature'] as const).map((skill) => (
                      <label key={skill}>
                        <input
                          type="radio"
                          checked={
                            draft.primalOrder?.orderId === 'magician' &&
                            draft.primalOrder.magicianChoices
                              ?.skillBonusTarget === skill
                          }
                          onChange={() =>
                            patch({
                              primalOrder: {
                                orderId: 'magician',
                                magicianChoices: {
                                  additionalCantripId:
                                    draft.primalOrder?.orderId === 'magician'
                                      ? (draft.primalOrder.magicianChoices
                                          ?.additionalCantripId ?? '')
                                      : '',
                                  skillBonusTarget: skill,
                                },
                              },
                            })
                          }
                        />
                        {label(skill)}
                      </label>
                    ))}
                  </fieldset>
                </>
              )}
            </>
          )}
          {current === 'Spells' && (
            <>
              <fieldset>
                <legend>
                  Druid cantrips ({cantripView.summary.normalSelected}/
                  {cantripView.summary.normalLimit} selected)
                </legend>
                {cantripView.options.map((option) => (
                  <label
                    key={option.spellId}
                    className={
                      option.selectionSource === 'magician'
                        ? 'granted-cantrip'
                        : undefined
                    }
                  >
                    <input
                      type="checkbox"
                      checked={option.checked}
                      disabled={option.disabled}
                      aria-describedby={
                        option.sourceLabel
                          ? `cantrip-${option.spellId}-source`
                          : undefined
                      }
                      onChange={() =>
                        patch({
                          selectedCantripIds: toggle(
                            draft.selectedCantripIds,
                            option.spellId,
                          ),
                        })
                      }
                    />
                    <span>{option.name}</span>
                    {option.sourceLabel && (
                      <small id={`cantrip-${option.spellId}-source`}>
                        {option.sourceLabel}
                      </small>
                    )}
                  </label>
                ))}
                {magicianCantripId && (
                  <div className="cantrip-selection-summary">
                    <p>
                      Additional from Magician:{' '}
                      {
                        cantripView.options.find(
                          (option) => option.spellId === magicianCantripId,
                        )?.name
                      }
                    </p>
                    <p>
                      Granted selections: {cantripView.summary.grantedCount}
                    </p>
                    <p>
                      Total known cantrips: {cantripView.summary.totalKnown}
                    </p>
                  </div>
                )}
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
          {current === 'Advancement' && (
            <>
              <p>Choose one permanent advancement at each Druid milestone.</p>
              {[4, 8]
                .filter((level) => draft.targetLevel >= level)
                .map((level) => {
                  const selected = draft.advancementChoices.find(
                    (item) => item.characterLevel === level,
                  );
                  const setChoice = (
                    choice: import('../domain/leveling').AdvancementChoice,
                  ) =>
                    patch({
                      advancementChoices: [
                        ...draft.advancementChoices.filter(
                          (item) => item.characterLevel !== level,
                        ),
                        { classId: 'druid', characterLevel: level, choice },
                      ],
                    });
                  return (
                    <fieldset key={level}>
                      <legend>Level {level} Advancement</legend>
                      <button
                        type="button"
                        onClick={() =>
                          setChoice({
                            type: 'ability-score-improvement',
                            increases: [{ ability: 'wisdom', amount: 2 }],
                          })
                        }
                      >
                        Ability Score Improvement
                      </button>{' '}
                      <button
                        type="button"
                        onClick={() =>
                          setChoice({
                            type: 'general-feat',
                            featId: 'resilient',
                            selections: {
                              ability: 'constitution',
                              savingThrow: 'constitution',
                            },
                          })
                        }
                      >
                        Resilient (General Feat)
                      </button>
                      {selected?.choice.type ===
                        'ability-score-improvement' && (
                        <label>
                          Increase one ability by 2
                          <select
                            value={selected.choice.increases[0]?.ability}
                            onChange={(event) =>
                              setChoice({
                                type: 'ability-score-improvement',
                                increases: [
                                  {
                                    ability: event.target.value as AbilityName,
                                    amount: 2,
                                  },
                                ],
                              })
                            }
                          >
                            {abilityNames.map((ability) => (
                              <option key={ability}>{ability}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      {selected && (
                        <p>
                          Selected:{' '}
                          {selected.choice.type === 'ability-score-improvement'
                            ? `${label(selected.choice.increases[0].ability)} +2`
                            : 'Resilient (Constitution +1)'}
                        </p>
                      )}
                    </fieldset>
                  );
                })}
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
                  {draft.advancementChoices.map((choice) => (
                    <div key={choice.characterLevel}>
                      <dt>Level {choice.characterLevel} Advancement</dt>
                      <dd>
                        {choice.choice.type === 'ability-score-improvement'
                          ? `Ability Score Improvement — ${choice.choice.increases.map((increase) => `${label(increase.ability)} +${increase.amount}`).join(', ')}`
                          : `General Feat — ${choice.choice.featId}`}
                      </dd>
                    </div>
                  ))}
                  <dt>Primal Order</dt>
                  <dd>{preview.primalOrder?.name ?? 'Incomplete'}</dd>
                  <dt>Armor Class</dt>
                  <dd>{preview.armorClass}</dd>
                  <dt>Spell save DC / attack</dt>
                  <dd>
                    {preview.spellSaveDc} / +{preview.spellAttackBonus}
                  </dd>
                  <dt>Druid cantrips</dt>
                  <dd>
                    {cantripView.options
                      .filter((option) => option.selectionSource === 'normal')
                      .map((option) => option.name)
                      .join(', ') || 'None'}
                  </dd>
                  <dt>Magician cantrip</dt>
                  <dd>
                    {cantripView.options.find(
                      (option) => option.selectionSource === 'magician',
                    )?.name ?? 'None'}
                  </dd>
                  <dt>Total known cantrips</dt>
                  <dd>{cantripView.summary.totalKnown}</dd>
                  <dt>Prepared and granted spells</dt>
                  <dd>
                    {preview.spells
                      .filter(
                        (spell) =>
                          !cantripView.options.some(
                            (option) => option.spellId === spell.id,
                          ),
                      )
                      .map((spell) => spell.name)
                      .join(', ') || 'None'}
                  </dd>
                  <dt>Druid starting choice</dt>
                  <dd>
                    {
                      draft.startingEquipmentChoices.find((choice) =>
                        choice.sourceId.startsWith('druid'),
                      )?.choiceType
                    }
                  </dd>
                  <dt>Farmer starting choice</dt>
                  <dd>
                    {
                      draft.startingEquipmentChoices.find((choice) =>
                        choice.sourceId.startsWith('farmer'),
                      )?.choiceType
                    }
                  </dd>
                  <dt>Starting funds / spent / remaining</dt>
                  <dd>
                    {formatWallet(equipmentModel.summary.availableWallet)} /{' '}
                    {formatWallet(equipmentModel.summary.cartTotalWallet)} /{' '}
                    {formatWallet(equipmentModel.summary.remainingWallet)}
                  </dd>
                  <dt>Starting equipment</dt>
                  <dd>
                    <ul>
                      {preview.inventory.items.map((item) => (
                        <li key={item.instanceId}>
                          {equipmentRegistry[item.definitionId]?.name ??
                            item.definitionId}
                          {item.quantity > 1 ? ` ×${item.quantity}` : ''} ·{' '}
                          {item.equipped ? 'Equipped' : 'Carried'} ·{' '}
                          {item.acquisitionSource?.type === 'starting-purchase'
                            ? 'Purchased'
                            : item.acquisitionSource?.type ===
                                'starting-package'
                              ? item.acquisitionSource.sourceId.startsWith(
                                  'druid',
                                )
                                ? 'Druid package'
                                : 'Farmer package'
                              : 'Legacy'}
                        </li>
                      ))}
                    </ul>
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
