import {
  computeCharacter,
  type CharacterBuild,
  type CharacterSession,
} from '../character';
import { resolveResources } from '../resources';
import type { RuleRegistry } from '../rules';
import type { CharacterDraft } from './character-draft';
import {
  finalAbilityScores,
  validateCharacterDraft,
  type CreationDiagnostic,
} from './draft-validation';
import { startingInventory } from '../equipment';
export type CreateCharacterResult =
  | {
      readonly success: true;
      readonly build: CharacterBuild;
      readonly session: CharacterSession;
    }
  | {
      readonly success: false;
      readonly diagnostics: readonly CreationDiagnostic[];
    };
export function createCharacterFromDraft(
  draft: CharacterDraft,
  registry: RuleRegistry,
): CreateCharacterResult {
  const diagnostics = validateCharacterDraft(draft, registry);
  const scores = finalAbilityScores(draft);
  if (diagnostics.length || !scores) return { success: false, diagnostics };
  const cls = registry.classes.druid;
  const slotProgression = Object.fromEntries(
    cls.progression.map((p) => [p.level, p.spellSlots]),
  );
  const build: CharacterBuild = {
    id: draft.id,
    name: draft.name.trim(),
    ruleset: '5e-2024',
    totalLevel: draft.targetLevel,
    abilityScores: scores,
    hitPointProgression: {
      hitDie: 8,
      levelGains: Object.entries(draft.hitPointChoices).map(
        ([level, choice]) => ({
          level: Number(level),
          baseHitPoints: choice.baseHitPoints,
        }),
      ),
      perLevelBonuses: [],
      flatBonuses: [],
    },
    savingThrowProficiencies: cls.savingThrows,
    skillProficiencies: [
      ...registry.backgrounds.farmer.skills,
      ...draft.selectedSkillProficiencies,
    ],
    expertiseSkills: [],
    armorClassSources: [],
    spellcasting: { ability: 'wisdom', slotProgression },
    feats: ['Tough'],
    class: {
      classId: 'druid',
      level: draft.targetLevel,
      primalOrder: draft.primalOrder,
      ...(draft.subclassId ? { subclassId: draft.subclassId } : {}),
    },
    species: {
      speciesId: 'tiefling',
      optionId: 'chthonic',
      spellcastingAbility: 'wisdom',
    },
    backgroundId: 'farmer',
    featIds: ['tough'],
    cantripIds: [...draft.selectedCantripIds],
    preparedSpellIds: [...draft.selectedPreparedSpellIds],
  };
  const resourceState = Object.fromEntries(
    resolveResources(registry, draft.targetLevel, {}, [
      'druid',
      ...(draft.subclassId ? [draft.subclassId] : []),
      'tiefling',
      'chthonic',
      'tough',
    ]).resources.map((r) => [r.id, r.maximum]),
  );
  const provisional: CharacterSession = {
    currentHp: 0,
    temporaryHp: 0,
    spentHitDice: 0,
    spentSpellSlots: {},
    resources: resourceState,
    conditions: [],
    inventory: startingInventory(),
    ...(draft.landType
      ? { selections: { circleOfTheLand: { landType: draft.landType } } }
      : {}),
  };
  const maximumHp = computeCharacter(build, provisional, registry).maximumHp
    .value;
  return {
    success: true,
    build,
    session: { ...provisional, currentHp: maximumHp },
  };
}
