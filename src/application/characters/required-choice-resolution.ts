import type { CharacterRecord } from './character-repository';
import { validateDruidPrimalOrder, type DruidPrimalOrderSelection, type RuleRegistry } from '../../domain/rules';

/** Validates first, then returns a single immutable record update. */
export function resolveDruidPrimalOrder(
  record: CharacterRecord,
  selection: DruidPrimalOrderSelection,
  registry: RuleRegistry,
): CharacterRecord {
  const diagnostics = validateDruidPrimalOrder(selection, record.build.cantripIds ?? [], registry);
  if (record.build.class?.classId !== 'druid' || diagnostics.length)
    throw new RangeError(diagnostics[0] ?? 'invalid-primal-order');
  return {
    ...record,
    build: {
      ...record.build,
      requiredBuildChoices: record.build.requiredBuildChoices?.filter((x) => x.choiceId !== 'druid.primal-order'),
      class: { ...record.build.class, primalOrder: selection },
    },
  };
}
