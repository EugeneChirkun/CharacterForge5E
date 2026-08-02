import {
  computeCharacter,
  type CharacterBuild,
  type CharacterSession,
  type ComputedCharacter,
} from '../character';
import type { LandType, RuleRegistry } from '../rules';
import { abilityNames, type AbilityName } from '../abilities';
import { maximumSpellLevel, validatePreparedSpells } from '../spells';
import {
  applyGeneralFeatEffects,
  generalFeatRegistry,
  validateFeatSelection,
  type FeatNestedChoices,
} from '../feats';
import { normalizeSubclassId, validateSubclassChoice } from '../subclasses';
export interface LevelUpDraft {
  readonly characterId: string;
  readonly fromLevel: number;
  readonly toLevel: number;
  readonly hitPointChoice?: {
    readonly type: 'fixed';
    readonly baseHitPoints: number;
  };
  readonly selectedPreparedSpellIds: readonly string[];
  readonly selectedCantripIds: readonly string[];
  readonly subclassId?: string;
  readonly landType?: LandType;
  readonly advancementChoice?: AdvancementChoice;
}
export interface AbilityScoreImprovementChoice {
  readonly type: 'ability-score-improvement';
  readonly increases: readonly {
    readonly ability: AbilityName;
    readonly amount: 1 | 2;
  }[];
}
export interface GeneralFeatChoice {
  readonly type: 'general-feat';
  readonly featId: string;
  readonly selections?: FeatNestedChoices;
}
export type AdvancementChoice =
  AbilityScoreImprovementChoice | GeneralFeatChoice;
export interface CharacterAdvancementChoice {
  readonly characterLevel: number;
  readonly classId: string;
  readonly choice: AdvancementChoice;
}
/** Pure milestone validation shared by creation, migration resolution, and level-up. */
export function validateAdvancementChoices(
  classId: string,
  classLevel: number,
  selections: readonly CharacterAdvancementChoice[],
  startingScores: Readonly<Record<AbilityName, number>>,
  existingFeatIds: readonly string[] = [],
): readonly LevelUpDiagnostic[] {
  const diagnostics: LevelUpDiagnostic[] = [];
  const relevant = selections.filter(
    (selection) => selection.classId === classId,
  );
  const scores = { ...startingScores };
  const featIds = [...existingFeatIds];
  for (const selection of relevant) {
    if (
      ![4, 8].includes(selection.characterLevel) ||
      selection.characterLevel > classLevel
    ) {
      diagnostics.push({
        type: 'invalid-advancement-choice',
        message: `A level ${selection.characterLevel} advancement cannot be selected for this character.`,
      });
      continue;
    }
    if (
      relevant.filter(
        (item) => item.characterLevel === selection.characterLevel,
      ).length > 1
    ) {
      diagnostics.push({
        type: 'invalid-advancement-choice',
        message: `Only one Druid level ${selection.characterLevel} advancement may be selected.`,
      });
      continue;
    }
    if (selection.choice.type === 'ability-score-improvement') {
      const increases = selection.choice.increases;
      const total = increases.reduce((sum, item) => sum + item.amount, 0);
      if (
        total !== 2 ||
        ![1, 2].includes(increases.length) ||
        new Set(increases.map((item) => item.ability)).size !==
          increases.length ||
        increases.some(
          (item) =>
            !abilityNames.includes(item.ability) ||
            (increases.length === 1 ? item.amount !== 2 : item.amount !== 1),
        )
      ) {
        diagnostics.push({
          type: 'invalid-ability-improvement',
          message: 'Increase one ability by 2 or two different abilities by 1.',
        });
        continue;
      }
      for (const increase of increases) {
        if (scores[increase.ability] + increase.amount > 20)
          diagnostics.push({
            type: 'ability-score-cap-exceeded',
            message: `${increase.ability} cannot exceed 20.`,
          });
        else scores[increase.ability] += increase.amount;
      }
    } else {
      const feat = generalFeatRegistry[selection.choice.featId];
      if (
        !feat ||
        (!feat.repeatable && featIds.includes(selection.choice.featId))
      )
        diagnostics.push({
          type: 'invalid-feat-choice',
          message: feat
            ? `${feat.name} cannot be selected more than once.`
            : 'That verified General Feat is not installed.',
        });
      else {
        const errors = validateFeatSelection(
          feat,
          selection.choice.selections ?? {},
          {
            abilityScores: scores,
            savingThrowProficiencies: [],
            skillProficiencies: [],
            expertiseSkills: [],
            featIds,
          } as unknown as CharacterBuild,
          selection.characterLevel,
        );
        if (errors.length)
          diagnostics.push({ type: 'invalid-feat-choice', message: errors[0] });
        else featIds.push(feat.id);
      }
    }
  }
  for (const definition of advancementDefinitions)
    if (
      definition.classId === classId &&
      classLevel >= definition.characterLevel &&
      !relevant.some(
        (selection) => selection.characterLevel === definition.characterLevel,
      )
    )
      diagnostics.push({
        type: 'missing-advancement-choice',
        message: `This Druid is missing the required level ${definition.characterLevel} advancement choice. Choose Ability Score Improvement or an eligible General Feat.`,
      });
  return diagnostics;
}
/** Data, rather than control flow, declares every supported choice milestone. */
export const advancementDefinitions = Object.freeze([
  {
    classId: 'druid',
    characterLevel: 4,
    choices: ['ability-score-improvement', 'general-feat'],
  },
  {
    classId: 'druid',
    characterLevel: 8,
    choices: ['ability-score-improvement', 'general-feat'],
  },
] as const);
export type LevelUpDiagnosticType =
  | 'character-not-found'
  | 'unsupported-character'
  | 'maximum-level-reached'
  | 'invalid-level-transition'
  | 'missing-hit-point-choice'
  | 'invalid-spell-choice'
  | 'missing-subclass-choice'
  | 'missing-land-type'
  | 'persistence-conflict'
  | 'corrupt-character-record'
  | 'invalid-ability-improvement'
  | 'ability-score-cap-exceeded'
  | 'duplicate-asi-target'
  | 'missing-advancement-choice'
  | 'invalid-feat-choice'
  | 'invalid-advancement-choice';
export interface LevelUpDiagnostic {
  readonly type: LevelUpDiagnosticType;
  readonly message: string;
}
export interface LevelUpChange {
  readonly label: string;
  readonly before: string | number;
  readonly after: string | number;
}
export interface LevelUpPreview {
  readonly before: ComputedCharacter;
  readonly after?: ComputedCharacter;
  readonly changes: readonly LevelUpChange[];
  readonly diagnostics: readonly LevelUpDiagnostic[];
}
export type ApplyLevelUpResult =
  | {
      readonly success: true;
      readonly build: CharacterBuild;
      readonly session: CharacterSession;
    }
  | {
      readonly success: false;
      readonly diagnostics: readonly LevelUpDiagnostic[];
    };
export function applyLevelUp(
  build: CharacterBuild,
  session: CharacterSession,
  draft: LevelUpDraft,
  registry: RuleRegistry,
): ApplyLevelUpResult {
  const diagnostics: LevelUpDiagnostic[] = [];
  if (build.class?.classId !== 'druid' || build.id !== draft.characterId)
    diagnostics.push({
      type: 'unsupported-character',
      message: 'Only saved Druid characters can level up.',
    });
  if (build.totalLevel >= 8)
    diagnostics.push({
      type: 'maximum-level-reached',
      message: 'Level 8 is the current maximum.',
    });
  if (
    draft.fromLevel !== build.totalLevel ||
    draft.toLevel !== build.totalLevel + 1
  )
    diagnostics.push({
      type: 'invalid-level-transition',
      message: 'Advance exactly one level.',
    });
  if (
    draft.hitPointChoice?.type !== 'fixed' ||
    draft.hitPointChoice.baseHitPoints !== 5
  )
    diagnostics.push({
      type: 'missing-hit-point-choice',
      message: 'Use the fixed 5 HP level gain.',
    });
  const progression = registry.classes.druid.progression.find(
    (p) => p.level === draft.toLevel,
  );
  if (progression) {
    const spells = validatePreparedSpells({
      preparedSpellIds: draft.selectedPreparedSpellIds,
      classId: 'druid',
      maximum: progression.preparedSpells,
      maximumSpellLevel: maximumSpellLevel(progression.spellSlots),
      grants: [],
      registry,
    });
    if (
      spells.diagnostics.length ||
      draft.selectedPreparedSpellIds.length !== progression.preparedSpells ||
      draft.selectedCantripIds.length !== progression.cantripsKnown
    )
      diagnostics.push({
        type: 'invalid-spell-choice',
        message:
          'Select the target level’s valid cantrips and prepared spells.',
      });
  }
  if (draft.toLevel === 3)
    for (const diagnostic of validateSubclassChoice({
      classId: 'druid',
      level: draft.toLevel,
      subclassId: draft.subclassId,
      landId: draft.landType,
    }))
      diagnostics.push({
        type:
          diagnostic.code === 'missing-circle-land'
            ? 'missing-land-type'
            : 'missing-subclass-choice',
        message: diagnostic.message,
      });
  const advancement = advancementDefinitions.find(
    (definition) =>
      definition.classId === build.class?.classId &&
      definition.characterLevel === draft.toLevel,
  );
  if (advancement && !draft.advancementChoice)
    diagnostics.push({
      type: 'missing-advancement-choice' as LevelUpDiagnosticType,
      message:
        'Choose an Ability Score Improvement or an eligible General Feat.',
    });
  if (draft.advancementChoice?.type === 'ability-score-improvement') {
    const increases = draft.advancementChoice.increases;
    const total = increases.reduce((sum, item) => sum + item.amount, 0);
    if (
      total !== 2 ||
      !increases.length ||
      increases.some((item) => !abilityNames.includes(item.ability))
    )
      diagnostics.push({
        type: 'invalid-ability-improvement' as LevelUpDiagnosticType,
        message: 'Increase one ability by 2 or two different abilities by 1.',
      });
    if (
      new Set(increases.map((item) => item.ability)).size !== increases.length
    )
      diagnostics.push({
        type: 'duplicate-asi-target' as LevelUpDiagnosticType,
        message: 'Choose two different abilities for split improvements.',
      });
    if (
      increases.some(
        (item) => build.abilityScores[item.ability] + item.amount > 20,
      )
    )
      diagnostics.push({
        type: 'ability-score-cap-exceeded' as LevelUpDiagnosticType,
        message: 'Ability scores cannot exceed 20.',
      });
  }
  if (draft.advancementChoice?.type === 'general-feat') {
    const feat = generalFeatRegistry[draft.advancementChoice.featId];
    const featErrors = feat
      ? validateFeatSelection(
          feat,
          draft.advancementChoice.selections ?? {},
          build,
          draft.toLevel,
        )
      : ['That feat is not supported.'];
    if (!feat || featErrors.length)
      diagnostics.push({
        type: 'invalid-feat-choice' as LevelUpDiagnosticType,
        message:
          featErrors[0] ??
          'Choose an available supported feat whose prerequisites you meet.',
      });
  }
  if (diagnostics.length || !progression || !draft.hitPointChoice)
    return { success: false, diagnostics };
  const subclassId =
    build.class?.subclassId ?? normalizeSubclassId(draft.subclassId);
  const abilityScores = { ...build.abilityScores };
  if (draft.advancementChoice?.type === 'ability-score-improvement')
    for (const increase of draft.advancementChoice.increases)
      abilityScores[increase.ability] += increase.amount;
  let nextBuild: CharacterBuild = {
    ...build,
    totalLevel: draft.toLevel,
    abilityScores,
    advancementChoices: draft.advancementChoice
      ? [
          ...(build.advancementChoices ?? []),
          {
            characterLevel: draft.toLevel,
            classId: 'druid',
            choice: draft.advancementChoice,
          },
        ]
      : build.advancementChoices,
    featIds:
      draft.advancementChoice?.type === 'general-feat'
        ? [...(build.featIds ?? []), draft.advancementChoice.featId]
        : build.featIds,
    class: {
      classId: 'druid',
      level: draft.toLevel,
      ...(subclassId ? { subclassId } : {}),
    },
    hitPointProgression: {
      ...build.hitPointProgression,
      levelGains: [
        ...build.hitPointProgression.levelGains,
        {
          level: draft.toLevel,
          baseHitPoints: draft.hitPointChoice.baseHitPoints,
        },
      ],
    },
    cantripIds: [...draft.selectedCantripIds],
    preparedSpellIds: [...draft.selectedPreparedSpellIds],
  };
  if (draft.advancementChoice?.type === 'general-feat') {
    const definition = generalFeatRegistry[draft.advancementChoice.featId];
    nextBuild = applyGeneralFeatEffects(
      nextBuild,
      definition,
      draft.advancementChoice.selections ?? {},
    );
  }
  const nextSession: CharacterSession = {
    ...session,
    spentSpellSlots: Object.fromEntries(
      Object.entries(session.spentSpellSlots).filter(
        ([level]) => Number(level) <= maximumSpellLevel(progression.spellSlots),
      ),
    ),
    ...(draft.landType
      ? { selections: { circleOfTheLand: { landType: draft.landType } } }
      : {}),
  };
  return { success: true, build: nextBuild, session: nextSession };
}
export function previewLevelUp(
  build: CharacterBuild,
  session: CharacterSession,
  draft: LevelUpDraft,
  registry: RuleRegistry,
): LevelUpPreview {
  const before = computeCharacter(build, session, registry);
  const result = applyLevelUp(build, session, draft, registry);
  if (!result.success)
    return { before, changes: [], diagnostics: result.diagnostics };
  const after = computeCharacter(result.build, result.session, registry);
  return {
    before,
    after,
    diagnostics: [],
    changes: [
      {
        label: 'Level',
        before: build.totalLevel,
        after: result.build.totalLevel,
      },
      ...abilityNames
        .filter(
          (ability) =>
            build.abilityScores[ability] !==
            result.build.abilityScores[ability],
        )
        .map((ability) => ({
          label: ability[0].toUpperCase() + ability.slice(1),
          before: build.abilityScores[ability],
          after: result.build.abilityScores[ability],
        })),
      {
        label: 'Spell Save DC',
        before: before.spellcasting?.spellSaveDc.value ?? 0,
        after: after.spellcasting?.spellSaveDc.value ?? 0,
      },
      {
        label: 'Spell Attack',
        before: before.spellcasting?.spellAttackBonus.value ?? 0,
        after: after.spellcasting?.spellAttackBonus.value ?? 0,
      },
      {
        label: 'Passive Perception',
        before: before.passivePerception.value,
        after: after.passivePerception.value,
      },
      {
        label: 'Maximum HP',
        before: before.maximumHp.value,
        after: after.maximumHp.value,
      },
      {
        label: 'Proficiency bonus',
        before: before.proficiencyBonus.value,
        after: after.proficiencyBonus.value,
      },
      {
        label: 'Prepared spells',
        before: before.classLevel?.preparedSpells ?? 0,
        after: after.classLevel?.preparedSpells ?? 0,
      },
    ],
  };
}
