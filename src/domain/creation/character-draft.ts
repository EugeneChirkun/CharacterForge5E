import type { AbilityName } from '../abilities';
import type { SkillName } from '../skills';
import type { DruidPrimalOrderSelection, LandType } from '../rules';
import type {
  StartingEquipmentSourceChoice,
  StartingPurchaseCartItem,
} from '../equipment';
import type {
  AbilityAssignment,
  AbilityGenerationMethod,
} from './ability-generation';
import type { CharacterAdvancementChoice } from '../leveling';
export interface HitPointLevelChoice {
  readonly type: 'fixed';
  readonly baseHitPoints: number;
}
export interface CharacterDraft {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly name: string;
  readonly targetLevel: number;
  readonly classId: 'druid';
  readonly species: {
    readonly speciesId: 'tiefling';
    readonly optionId: 'chthonic';
  };
  readonly backgroundId: 'farmer';
  readonly featIds: readonly ['tough'];
  readonly abilityGenerationMethod: AbilityGenerationMethod;
  readonly baseAbilityScores: AbilityAssignment;
  readonly methodScores: Readonly<
    Record<AbilityGenerationMethod, AbilityAssignment>
  >;
  readonly backgroundAbilityAdjustments: Partial<
    Readonly<Record<AbilityName, number>>
  >;
  readonly selectedSkillProficiencies: readonly SkillName[];
  readonly equipmentChoiceIds: readonly string[];
  readonly startingEquipmentChoices: readonly StartingEquipmentSourceChoice[];
  /** Builder-only state. Materialized inventory, rather than this cart, is persisted on creation. */
  readonly startingPurchaseCart: readonly StartingPurchaseCartItem[];
  readonly selectedCantripIds: readonly string[];
  readonly selectedPreparedSpellIds: readonly string[];
  readonly primalOrder?: DruidPrimalOrderSelection;
  readonly subclassId?: 'druid.circle-of-the-land' | 'circle-of-the-land';
  readonly landType?: LandType;
  readonly hitPointChoices: Readonly<Record<number, HitPointLevelChoice>>;
  /** Permanent milestone decisions. Preview data is deliberately not stored. */
  readonly advancementChoices: readonly CharacterAdvancementChoice[];
}
export function newCharacterDraft(
  id: string = crypto.randomUUID(),
): CharacterDraft {
  const scores = {
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  };
  return {
    schemaVersion: 1,
    id,
    name: '',
    targetLevel: 1,
    classId: 'druid',
    species: { speciesId: 'tiefling', optionId: 'chthonic' },
    backgroundId: 'farmer',
    featIds: ['tough'],
    abilityGenerationMethod: 'standard-array',
    baseAbilityScores: scores,
    methodScores: {
      'standard-array': scores,
      'point-buy': {
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8,
      },
      manual: scores,
    },
    backgroundAbilityAdjustments: { constitution: 2, wisdom: 1 },
    selectedSkillProficiencies: [],
    equipmentChoiceIds: ['druid-farmer-preset'],
    startingEquipmentChoices: [
      { sourceId: 'druid.class.starting-equipment', choiceType: 'package' },
      {
        sourceId: 'farmer.background.starting-equipment',
        choiceType: 'package',
      },
    ],
    startingPurchaseCart: [],
    selectedCantripIds: [],
    selectedPreparedSpellIds: [],
    hitPointChoices: { 1: { type: 'fixed', baseHitPoints: 8 } },
    advancementChoices: [],
  };
}
