import type { CharacterBuild, CharacterSession } from '../character';
import { beastRegistry, type BeastDefinition } from './beasts';
export * from './beasts';

export interface WildShapeState {
  readonly beastId: string;
  readonly currentBeastHp: number;
  readonly maximumBeastHp: number;
  readonly transformedAt: string;
  readonly sourceFeature: 'druid-wild-shape';
  readonly metadata: Readonly<{
    durationHours: number;
    characterLevel: number;
  }>;
}
export type CharacterState =
  | { readonly type: 'normal' }
  | { readonly type: 'wild-shape'; readonly payload: WildShapeState };
export type CharacterStateDiagnostic =
  | 'invalid-character-state'
  | 'invalid-wild-shape'
  | 'unknown-beast'
  | 'no-wild-shape-uses'
  | 'invalid-transformation'
  | 'invalid-reversion';
export const normalCharacterState = (): CharacterState =>
  Object.freeze({ type: 'normal' });
export const availableWildShapeForms = (
  build: CharacterBuild,
): readonly BeastDefinition[] => {
  if (build.class?.classId !== 'druid' || (build.class.level ?? 0) < 2)
    return [];
  const level = build.class.level;
  const maximumCr = level >= 8 ? 1 : level >= 4 ? 0.5 : 0.25;
  return Object.values(beastRegistry).filter(
    (b) => b.verified && b.challengeRating <= maximumCr,
  );
};
export function transformWildShape(
  build: CharacterBuild,
  session: CharacterSession,
  beastId: string,
  now = new Date().toISOString(),
): CharacterSession {
  if ((session.characterState ?? normalCharacterState()).type !== 'normal')
    throw new Error('invalid-transformation');
  const beast = availableWildShapeForms(build).find((b) => b.id === beastId);
  if (!beast)
    throw new Error(
      beastRegistry[beastId] ? 'invalid-wild-shape' : 'unknown-beast',
    );
  const uses = session.resources['wild-shape'] ?? 0;
  if (uses < 1) throw new Error('no-wild-shape-uses');
  return {
    ...session,
    characterStateHistory: [
      ...(session.characterStateHistory ?? []),
      session.characterState ?? normalCharacterState(),
    ],
    resources: { ...session.resources, 'wild-shape': uses - 1 },
    characterState: {
      type: 'wild-shape',
      payload: Object.freeze({
        beastId,
        currentBeastHp: beast.hitPoints,
        maximumBeastHp: beast.hitPoints,
        transformedAt: now,
        sourceFeature: 'druid-wild-shape',
        metadata: Object.freeze({
          durationHours: Math.max(1, Math.floor((build.class?.level ?? 2) / 2)),
          characterLevel: build.totalLevel,
        }),
      }),
    },
  };
}
export function revertWildShape(session: CharacterSession): CharacterSession {
  if (session.characterState?.type !== 'wild-shape')
    throw new Error('invalid-reversion');
  return {
    ...session,
    characterStateHistory: [
      ...(session.characterStateHistory ?? []),
      session.characterState,
    ],
    characterState: normalCharacterState(),
  };
}
export function applyWildShapeDamage(
  session: CharacterSession,
  amount: number,
): CharacterSession {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error('invalid-wild-shape');
  if (session.characterState?.type !== 'wild-shape')
    return { ...session, currentHp: Math.max(0, session.currentHp - amount) };
  const p = session.characterState.payload;
  const overflow = Math.max(0, amount - p.currentBeastHp);
  return overflow > 0 || amount === p.currentBeastHp
    ? {
        ...session,
        currentHp: Math.max(0, session.currentHp - overflow),
        characterStateHistory: [
          ...(session.characterStateHistory ?? []),
          session.characterState,
        ],
        characterState: normalCharacterState(),
      }
    : {
        ...session,
        characterState: {
          type: 'wild-shape',
          payload: { ...p, currentBeastHp: p.currentBeastHp - amount },
        },
      };
}
export function healWildShape(
  session: CharacterSession,
  amount: number,
): CharacterSession {
  if (session.characterState?.type !== 'wild-shape') return session;
  const p = session.characterState.payload;
  return {
    ...session,
    characterState: {
      type: 'wild-shape',
      payload: {
        ...p,
        currentBeastHp: Math.min(p.maximumBeastHp, p.currentBeastHp + amount),
      },
    },
  };
}
