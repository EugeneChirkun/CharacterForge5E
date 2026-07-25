import {
  abilityNames,
  type AbilityName,
  type AbilityScores,
} from '../abilities';
import type { RuleRegistry } from '../rules';
import { maximumSpellLevel, validatePreparedSpells } from '../spells';
import { validateEquipment } from '../equipment';
import {
  calculatePointBuy,
  isCompleteScores,
  validateManualScores,
  validateStandardArrayAssignment,
} from './ability-generation';
import type { CharacterDraft } from './character-draft';

export type CreationDiagnosticType =
  | 'invalid-name'
  | 'invalid-target-level'
  | 'incomplete-standard-array'
  | 'duplicate-standard-array-value'
  | 'invalid-point-buy-score'
  | 'point-buy-budget-exceeded'
  | 'point-buy-budget-unspent'
  | 'invalid-manual-score'
  | 'invalid-background-adjustment'
  | 'missing-skill-choice'
  | 'too-many-skill-choices'
  | 'invalid-skill-choice'
  | 'duplicate-skill-choice'
  | 'invalid-equipment-choice'
  | 'missing-equipment-choice'
  | 'invalid-cantrip'
  | 'invalid-prepared-spell'
  | 'too-many-prepared-spells'
  | 'missing-subclass'
  | 'subclass-selected-too-early'
  | 'missing-land-type'
  | 'invalid-land-type'
  | 'missing-hit-point-choice'
  | 'invalid-hit-point-choice'
  | 'missing-rule-definition'
  | 'unsupported-option'
  | 'corrupt-draft';
export interface CreationDiagnostic {
  readonly type: CreationDiagnosticType;
  readonly message: string;
}
const diagnostic = (
  type: CreationDiagnosticType,
  message: string,
): CreationDiagnostic => ({ type, message });

export function finalAbilityScores(
  draft: CharacterDraft,
): AbilityScores | null {
  if (!isCompleteScores(draft.baseAbilityScores)) return null;
  const base = draft.baseAbilityScores;
  return Object.fromEntries(
    abilityNames.map((a) => [
      a,
      base[a] + (draft.backgroundAbilityAdjustments[a] ?? 0),
    ]),
  ) as unknown as AbilityScores;
}
export function validateCharacterDraft(
  draft: CharacterDraft,
  registry: RuleRegistry,
): readonly CreationDiagnostic[] {
  const out: CreationDiagnostic[] = [];
  if (!draft.name.trim() || draft.name.trim().length > 80)
    out.push(diagnostic('invalid-name', 'Enter a name of 1–80 characters.'));
  if (
    !Number.isInteger(draft.targetLevel) ||
    draft.targetLevel < 1 ||
    draft.targetLevel > 8
  )
    out.push(
      diagnostic(
        'invalid-target-level',
        'Level must be an integer from 1 to 8.',
      ),
    );
  if (
    draft.classId !== 'druid' ||
    draft.species.speciesId !== 'tiefling' ||
    draft.species.optionId !== 'chthonic' ||
    draft.backgroundId !== 'farmer' ||
    draft.featIds[0] !== 'tough'
  )
    out.push(
      diagnostic(
        'unsupported-option',
        'This MVP supports only the listed Druid origin.',
      ),
    );
  const abilityDiagnostics =
    draft.abilityGenerationMethod === 'standard-array'
      ? validateStandardArrayAssignment(draft.baseAbilityScores)
      : draft.abilityGenerationMethod === 'point-buy'
        ? calculatePointBuy(draft.baseAbilityScores).diagnostics
        : validateManualScores(draft.baseAbilityScores);
  out.push(
    ...abilityDiagnostics.map((d) =>
      diagnostic(
        d.type === 'invalid-standard-array-value'
          ? 'incomplete-standard-array'
          : d.type,
        'Ability score assignment is invalid.',
      ),
    ),
  );
  const background = registry.backgrounds.farmer;
  const adjustments = Object.entries(draft.backgroundAbilityAdjustments).filter(
    ([, value]) => value !== 0,
  ) as [AbilityName, number][];
  const adjustmentValues = adjustments.map(([, v]) => v).sort();
  const allowed = adjustments.every(([a]) =>
    background.abilityOptions.includes(a),
  );
  const pattern =
    adjustmentValues.join(',') === '1,2' ||
    adjustmentValues.join(',') === '1,1,1';
  const finals = finalAbilityScores(draft);
  if (
    !allowed ||
    !pattern ||
    adjustments.reduce((n, [, v]) => n + v, 0) !== 3 ||
    (finals && abilityNames.some((a) => finals[a] > 20))
  )
    out.push(
      diagnostic(
        'invalid-background-adjustment',
        'Farmer grants +2/+1 or +1/+1/+1 among Strength, Constitution, and Wisdom; final scores cannot exceed 20.',
      ),
    );
  const cls = registry.classes.druid;
  const uniqueSkills = new Set(draft.selectedSkillProficiencies);
  if (uniqueSkills.size !== draft.selectedSkillProficiencies.length)
    out.push(
      diagnostic('duplicate-skill-choice', 'Choose each skill only once.'),
    );
  if (draft.selectedSkillProficiencies.length < cls.skillChoices)
    out.push(
      diagnostic(
        'missing-skill-choice',
        `Choose ${cls.skillChoices} Druid skills.`,
      ),
    );
  if (draft.selectedSkillProficiencies.length > cls.skillChoices)
    out.push(
      diagnostic(
        'too-many-skill-choices',
        `Choose only ${cls.skillChoices} Druid skills.`,
      ),
    );
  if (
    draft.selectedSkillProficiencies.some(
      (s) => !cls.availableSkills.includes(s) || background.skills.includes(s),
    )
  )
    out.push(
      diagnostic(
        'invalid-skill-choice',
        'Choose eligible Druid skills not already granted by Farmer.',
      ),
    );
  out.push(
    ...validateEquipment(draft.equipmentChoiceIds).map((d) =>
      diagnostic(d.type, 'Select the supported MVP equipment preset.'),
    ),
  );
  const progression = cls.progression.find(
    (p) => p.level === draft.targetLevel,
  );
  if (!progression)
    out.push(
      diagnostic(
        'missing-rule-definition',
        'Druid progression is unavailable.',
      ),
    );
  else {
    const cantrips = draft.selectedCantripIds;
    if (
      new Set(cantrips).size !== cantrips.length ||
      cantrips.length !== progression.cantripsKnown ||
      cantrips.some(
        (id) =>
          registry.spells[id]?.level !== 0 ||
          !registry.spells[id]?.classIds.includes('druid'),
      )
    )
      out.push(
        diagnostic(
          'invalid-cantrip',
          `Choose exactly ${progression.cantripsKnown} unique Druid cantrips.`,
        ),
      );
    const spellResult = validatePreparedSpells({
      preparedSpellIds: draft.selectedPreparedSpellIds,
      classId: 'druid',
      maximum: progression.preparedSpells,
      maximumSpellLevel: maximumSpellLevel(progression.spellSlots),
      grants: [],
      registry,
    });
    if (
      spellResult.diagnostics.length ||
      draft.selectedPreparedSpellIds.length !== progression.preparedSpells
    )
      out.push(
        diagnostic(
          draft.selectedPreparedSpellIds.length > progression.preparedSpells
            ? 'too-many-prepared-spells'
            : 'invalid-prepared-spell',
          `Choose exactly ${progression.preparedSpells} eligible prepared spells.`,
        ),
      );
  }
  if (draft.targetLevel >= cls.subclassUnlockLevel) {
    if (draft.subclassId !== 'circle-of-the-land')
      out.push(
        diagnostic(
          'missing-subclass',
          'Circle of the Land is required at level 3.',
        ),
      );
    if (!draft.landType)
      out.push(diagnostic('missing-land-type', 'Choose a land type.'));
    else if (
      !['arid', 'polar', 'temperate', 'tropical'].includes(draft.landType)
    )
      out.push(
        diagnostic('invalid-land-type', 'Choose a supported land type.'),
      );
  } else if (draft.subclassId || draft.landType)
    out.push(
      diagnostic(
        'subclass-selected-too-early',
        'Subclass choices begin at level 3.',
      ),
    );
  for (let level = 1; level <= draft.targetLevel; level += 1) {
    const hp = draft.hitPointChoices[level];
    if (!hp)
      out.push(
        diagnostic(
          'missing-hit-point-choice',
          `Missing HP choice for level ${level}.`,
        ),
      );
    else if (hp.type !== 'fixed' || hp.baseHitPoints !== (level === 1 ? 8 : 5))
      out.push(
        diagnostic(
          'invalid-hit-point-choice',
          `Level ${level} must use the fixed MVP HP value.`,
        ),
      );
  }
  return out;
}
