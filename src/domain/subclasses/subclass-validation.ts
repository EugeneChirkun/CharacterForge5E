import { circleOfTheLand, normalizeSubclassId } from './subclass-registry';
import type {
  CircleLandId,
  SubclassDiagnosticCode,
} from './subclass-definition';
export interface SubclassDiagnostic {
  readonly code: SubclassDiagnosticCode;
  readonly message: string;
}
export function validateSubclassChoice(input: {
  classId: string;
  level: number;
  subclassId?: string;
  landId?: string;
}): readonly SubclassDiagnostic[] {
  const diagnostics: SubclassDiagnostic[] = [];
  if (input.level < circleOfTheLand.selectionLevel && input.subclassId)
    diagnostics.push({
      code: 'subclass-selected-too-early',
      message: 'A Druid subclass cannot be selected before level 3.',
    });
  if (input.level >= 3 && !input.subclassId)
    diagnostics.push({
      code: 'missing-required-subclass',
      message: 'Choose and confirm a Druid subclass.',
    });
  if (input.subclassId && !normalizeSubclassId(input.subclassId))
    diagnostics.push({
      code: 'subclass-not-installed',
      message: 'That subclass is not installed in the current rules package.',
    });
  if (input.subclassId && input.classId !== 'druid')
    diagnostics.push({
      code: 'subclass-class-mismatch',
      message: 'Circle of the Land is available only to Druids.',
    });
  if (
    input.level >= 3 &&
    normalizeSubclassId(input.subclassId) &&
    !input.landId
  )
    diagnostics.push({
      code: 'missing-circle-land',
      message: 'Choose an initial Circle Land.',
    });
  if (
    input.landId &&
    !circleOfTheLand.landIds.includes(input.landId as CircleLandId)
  )
    diagnostics.push({
      code: 'invalid-circle-land',
      message: 'Choose Arid, Polar, Temperate, or Tropical.',
    });
  return diagnostics;
}
export function subclassDiagnosticMessage(
  code: SubclassDiagnosticCode,
): string {
  const messages: Record<SubclassDiagnosticCode, string> = {
    'missing-required-subclass':
      'This Druid is missing a required subclass choice.',
    'invalid-subclass': 'The saved subclass is invalid.',
    'subclass-not-installed':
      'That subclass is not installed in the current rules package.',
    'subclass-class-mismatch': 'That subclass does not belong to this class.',
    'subclass-selected-too-early':
      'A subclass cannot be selected before its selection level.',
    'duplicate-subclass-choice':
      'A permanent subclass has already been selected.',
    'missing-circle-land': 'Choose a Circle Land to continue.',
    'invalid-circle-land': 'The saved Circle Land is invalid.',
    'circle-land-not-available': 'That Circle Land is not installed.',
    'corrupt-subclass-state':
      'The saved subclass information needs to be repaired.',
  };
  return messages[code];
}
