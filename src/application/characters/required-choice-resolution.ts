import type { CharacterRecord } from './character-repository';
import {
  validateDruidPrimalOrder,
  type DruidPrimalOrderSelection,
  type RuleRegistry,
} from '../../domain/rules';
import type { AdvancementChoice } from '../../domain/leveling';
import {
  applyGeneralFeatEffects,
  generalFeatRegistry,
} from '../../domain/feats';

/** Validates first, then returns a single immutable record update. */
export function resolveDruidPrimalOrder(
  record: CharacterRecord,
  selection: DruidPrimalOrderSelection,
  registry: RuleRegistry,
): CharacterRecord {
  const diagnostics = validateDruidPrimalOrder(
    selection,
    record.build.cantripIds ?? [],
    registry,
  );
  if (record.build.class?.classId !== 'druid' || diagnostics.length)
    throw new RangeError(diagnostics[0] ?? 'invalid-primal-order');
  return {
    ...record,
    build: {
      ...record.build,
      requiredBuildChoices: record.build.requiredBuildChoices?.filter(
        (x) => x.choiceId !== 'druid.primal-order',
      ),
      class: { ...record.build.class, primalOrder: selection },
    },
  };
}

/** Resolves the oldest missing milestone atomically; session and inventory are untouched. */
export function resolveDruidAdvancement(
  record: CharacterRecord,
  classLevel: 4 | 8,
  choice: AdvancementChoice,
): CharacterRecord {
  const requiredId = `druid.advancement.${classLevel}` as const;
  if (
    record.build.class?.classId !== 'druid' ||
    !record.build.requiredBuildChoices?.some(
      (item) => item.choiceId === requiredId,
    ) ||
    (classLevel === 8 &&
      record.build.requiredBuildChoices.some(
        (item) => item.choiceId === 'druid.advancement.4',
      ))
  )
    throw new RangeError('Resolve missing Druid advancements in level order.');
  let build: CharacterRecord['build'] = {
    ...record.build,
    advancementChoices: [
      ...(record.build.advancementChoices ?? []),
      { classId: 'druid', characterLevel: classLevel, choice },
    ],
    requiredBuildChoices: record.build.requiredBuildChoices.filter(
      (item) => item.choiceId !== requiredId,
    ),
  };
  if (choice.type === 'ability-score-improvement') {
    const abilityScores = { ...build.abilityScores };
    for (const increase of choice.increases)
      abilityScores[increase.ability] += increase.amount;
    if (Object.values(abilityScores).some((score) => score > 20))
      throw new RangeError('Ability scores cannot exceed 20.');
    build = { ...build, abilityScores };
  } else {
    const definition = generalFeatRegistry[choice.featId];
    if (!definition)
      throw new RangeError('That verified General Feat is not installed.');
    build = applyGeneralFeatEffects(build, definition, choice.selections ?? {});
  }
  return { ...record, build };
}
