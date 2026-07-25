import {
  computeCharacter,
  type CharacterBuild,
  type CharacterSession,
  type ComputedCharacter,
} from '../character';
import type { LandType, RuleRegistry } from '../rules';
import { maximumSpellLevel, validatePreparedSpells } from '../spells';
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
  readonly subclassId?: 'circle-of-the-land';
  readonly landType?: LandType;
}
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
  | 'corrupt-character-record';
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
  if (draft.toLevel === 3 && draft.subclassId !== 'circle-of-the-land')
    diagnostics.push({
      type: 'missing-subclass-choice',
      message: 'Choose Circle of the Land.',
    });
  if (draft.toLevel === 3 && !draft.landType)
    diagnostics.push({
      type: 'missing-land-type',
      message: 'Choose a land type.',
    });
  if (diagnostics.length || !progression || !draft.hitPointChoice)
    return { success: false, diagnostics };
  const subclassId = build.class?.subclassId ?? draft.subclassId;
  const nextBuild: CharacterBuild = {
    ...build,
    totalLevel: draft.toLevel,
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
