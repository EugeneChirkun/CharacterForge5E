import {
  beastRegistry,
  type CharacterState,
} from '../../domain/character-state';
import type { CharacterViewModel } from '../../features/characters/character.types';
export interface TransformationPreview {
  readonly beastId: string;
  readonly beastName: string;
  readonly changes: readonly {
    readonly label: string;
    readonly before: string | number;
    readonly after: string | number;
  }[];
}
export function previewTransformation(
  c: CharacterViewModel,
  beastId: string,
): TransformationPreview {
  const b = c.availableWildShapeForms.find((x) => x.id === beastId);
  if (!b)
    throw new Error(
      beastRegistry[beastId] ? 'invalid-wild-shape' : 'unknown-beast',
    );
  const uses = c.resources.find((r) => r.id === 'wild-shape')?.current ?? 0;
  if (uses < 1) throw new Error('no-wild-shape-uses');
  return {
    beastId,
    beastName: b.name,
    changes: [
      { label: 'Armor Class', before: c.armorClass, after: b.armorClass },
      { label: 'Speed', before: `${c.speed} ft.`, after: b.speed },
      { label: 'Size', before: 'Medium', after: b.size },
      { label: 'Current Form', before: 'Normal', after: b.name },
      { label: 'Wild Shape Uses', before: uses, after: uses - 1 },
    ],
  };
}
export function transformView(
  c: CharacterViewModel,
  beastId: string,
  now = new Date().toISOString(),
): CharacterViewModel {
  const p = previewTransformation(c, beastId);
  const b = beastRegistry[beastId];
  const state: CharacterState = {
    type: 'wild-shape',
    payload: {
      beastId,
      currentBeastHp: b.hitPoints,
      maximumBeastHp: b.hitPoints,
      transformedAt: now,
      sourceFeature: 'druid-wild-shape',
      metadata: {
        durationHours: Math.max(1, Math.floor(c.level / 2)),
        characterLevel: c.level,
      },
    },
  };
  return {
    ...c,
    characterStateHistory: [
      ...(c.characterStateHistory ?? []),
      c.characterState,
    ],
    characterState: state,
    armorClass: b.armorClass,
    speed: b.speedFeet,
    abilities: {
      ...c.abilities,
      ...Object.fromEntries(
        (['strength', 'dexterity', 'constitution'] as const).map((a) => [
          a,
          {
            ...c.abilities[a],
            score: b.abilityScores[a],
            modifier: Math.floor((b.abilityScores[a] - 10) / 2),
          },
        ]),
      ),
    },
    resources: c.resources.map((r) =>
      r.id === 'wild-shape' ? { ...r, current: Number(p.changes[4].after) } : r,
    ),
  };
}
export function revertView(c: CharacterViewModel): CharacterViewModel {
  if (c.characterState.type !== 'wild-shape')
    throw new Error('invalid-reversion');
  return {
    ...c,
    characterStateHistory: [
      ...(c.characterStateHistory ?? []),
      c.characterState,
    ],
    characterState: { type: 'normal' },
    armorClass: c.baseArmorClass ?? c.armorClass,
    speed: c.baseSpeed ?? 30,
    abilities: c.baseAbilities ?? c.abilities,
  };
}
export function damageView(
  c: CharacterViewModel,
  amount: number,
): CharacterViewModel {
  if (c.characterState.type !== 'wild-shape')
    return { ...c, currentHp: Math.max(0, c.currentHp - amount) };
  const hp = c.characterState.payload.currentBeastHp;
  if (amount >= hp) {
    const reverted = revertView(c);
    return {
      ...reverted,
      currentHp: Math.max(0, c.currentHp - (amount - hp)),
    };
  }
  return {
    ...c,
    characterState: {
      type: 'wild-shape',
      payload: { ...c.characterState.payload, currentBeastHp: hp - amount },
    },
  };
}
export function healView(
  c: CharacterViewModel,
  amount: number,
): CharacterViewModel {
  if (c.characterState.type !== 'wild-shape')
    return { ...c, currentHp: Math.min(c.maximumHp, c.currentHp + amount) };
  const p = c.characterState.payload;
  return {
    ...c,
    characterState: {
      type: 'wild-shape',
      payload: {
        ...p,
        currentBeastHp: Math.min(p.maximumBeastHp, p.currentBeastHp + amount),
      },
    },
  };
}
