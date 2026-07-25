import type { CharacterSession } from '../character';
import type { LandType, RuleRegistry } from '../rules';
import { resourceMaximum } from '../resources';
export interface RestChange {
  readonly type:
    | 'restore-hit-points'
    | 'restore-resource'
    | 'restore-spell-slots'
    | 'clear-temporary-hit-points'
    | 'change-selection';
  readonly label: string;
  readonly before?: number | string;
  readonly after?: number | string;
  readonly sourceId?: string;
}
export interface RestPreview {
  readonly restType: 'short' | 'long';
  readonly changes: readonly RestChange[];
  readonly warnings: readonly {
    readonly type: 'hit-dice-spending-deferred';
    readonly message: string;
  }[];
}
export type RestResult =
  | {
      readonly success: true;
      readonly session: CharacterSession;
      readonly preview: RestPreview;
    }
  | {
      readonly success: false;
      readonly session: CharacterSession;
      readonly errors: readonly {
        readonly type: 'invalid-land-selection';
        readonly value: string;
      }[];
    };
const lands: readonly LandType[] = ['arid', 'polar', 'temperate', 'tropical'];
export function isLandType(value: string): value is LandType {
  return lands.includes(value as LandType);
}
export function changeLandType(
  session: CharacterSession,
  landType: LandType,
): CharacterSession {
  if (!isLandType(landType))
    throw new RangeError(`Invalid land type: ${String(landType)}`);
  return {
    ...session,
    selections: { ...session.selections, circleOfTheLand: { landType } },
  };
}
function transition(
  type: 'short' | 'long',
  input: {
    session: CharacterSession;
    registry: RuleRegistry;
    classLevel: number;
    maximumHp: number;
    spellSlotMaximums: Readonly<Record<number, number>>;
    activeOwnerIds: readonly string[];
    selectedLandType?: string;
  },
) {
  const errors: { type: 'invalid-land-selection'; value: string }[] = [];
  if (input.selectedLandType && !isLandType(input.selectedLandType))
    errors.push({
      type: 'invalid-land-selection',
      value: input.selectedLandType,
    });
  if (errors.length) return { errors };
  let session: CharacterSession = {
    ...input.session,
    resources: { ...input.session.resources },
    spentSpellSlots: { ...input.session.spentSpellSlots },
  };
  const changes: RestChange[] = [];
  if (type === 'long') {
    if (session.currentHp !== input.maximumHp)
      changes.push({
        type: 'restore-hit-points',
        label: 'Hit Points',
        before: session.currentHp,
        after: input.maximumHp,
      });
    if (session.temporaryHp)
      changes.push({
        type: 'clear-temporary-hit-points',
        label: 'Temporary Hit Points',
        before: session.temporaryHp,
        after: 0,
      });
    if (Object.values(session.spentSpellSlots).some((x) => x > 0))
      changes.push({
        type: 'restore-spell-slots',
        label: 'Spell slots',
        before: 'spent',
        after: 'all available',
      });
    session = {
      ...session,
      currentHp: input.maximumHp,
      temporaryHp: 0,
      spentSpellSlots: Object.fromEntries(
        Object.keys(input.spellSlotMaximums).map((k) => [Number(k), 0]),
      ),
    };
    if (
      input.selectedLandType &&
      input.selectedLandType !== session.selections?.circleOfTheLand?.landType
    ) {
      changes.push({
        type: 'change-selection',
        label: 'Circle land',
        before: session.selections?.circleOfTheLand?.landType,
        after: input.selectedLandType,
      });
      session = changeLandType(session, input.selectedLandType as LandType);
    }
  }
  for (const def of Object.values(input.registry.resources)) {
    if (
      def.minimumLevel > input.classLevel ||
      !input.activeOwnerIds.includes(def.ownerId)
    )
      continue;
    const recovery = def.recovery.find((r) => r.restType === type);
    if (!recovery) continue;
    const maximum = resourceMaximum(def, input.classLevel);
    const before = session.resources[def.id] ?? maximum;
    const after =
      recovery.amount === 'all'
        ? maximum
        : Math.min(maximum, before + recovery.amount);
    if (after !== before)
      changes.push({
        type: 'restore-resource',
        label: def.name,
        before,
        after,
        sourceId: def.id,
      });
    session = {
      ...session,
      resources: { ...session.resources, [def.id]: after },
    };
  }
  return {
    session,
    preview: {
      restType: type,
      changes,
      warnings:
        type === 'short'
          ? [
              {
                type: 'hit-dice-spending-deferred' as const,
                message:
                  'Hit Dice spending is not represented in this interface.',
              },
            ]
          : [],
    },
  };
}
export function previewShortRest(
  input: Parameters<typeof transition>[1],
): RestPreview {
  return transition('short', input).preview!;
}
export function performShortRest(
  input: Parameters<typeof transition>[1],
): RestResult {
  const t = transition('short', input);
  return t.errors
    ? { success: false, session: input.session, errors: t.errors }
    : { success: true, session: t.session!, preview: t.preview! };
}
export function previewLongRest(
  input: Parameters<typeof transition>[1],
): RestPreview {
  return transition('long', input).preview!;
}
export function performLongRest(
  input: Parameters<typeof transition>[1],
): RestResult {
  const t = transition('long', input);
  return t.errors
    ? { success: false, session: input.session, errors: t.errors }
    : { success: true, session: t.session!, preview: t.preview! };
}
