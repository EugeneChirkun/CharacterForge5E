import { describe, expect, test } from 'vitest';
import {
  applyWildShapeDamage,
  availableWildShapeForms,
  beastRegistry,
  revertWildShape,
  transformWildShape,
} from '../domain/character-state';
import { computeCharacter } from '../domain/character';
import {
  referenceBuild,
  referenceSession,
} from '../features/characters/referenceCharacter';
import { CURRENT_ITERATION } from '../meta';

describe('Iteration 3.5F character state and Wild Shape', () => {
  test('filters verified forms and produces a computed overlay', () => {
    const forms = availableWildShapeForms(referenceBuild);
    expect(forms.length).toBeGreaterThan(0);
    expect(forms.every((x) => x.verified)).toBe(true);
    const session = transformWildShape(
      referenceBuild,
      {
        ...referenceSession,
        resources: { ...referenceSession.resources, 'wild-shape': 2 },
      },
      'wolf',
      '2026-08-03T00:00:00.000Z',
    );
    expect(session.resources['wild-shape']).toBe(1);
    expect(computeCharacter(referenceBuild, session).armorClass.value).toBe(
      beastRegistry.wolf.armorClass,
    );
  });
  test('routes overflow and supports immutable manual reversion/history', () => {
    const initial = {
      ...referenceSession,
      resources: { ...referenceSession.resources, 'wild-shape': 2 },
    };
    const shaped = transformWildShape(referenceBuild, initial, 'wolf');
    const damaged = applyWildShapeDamage(shaped, 15);
    expect(damaged.characterState?.type).toBe('normal');
    expect(damaged.currentHp).toBe(initial.currentHp - 4);
    expect(shaped.characterState?.type).toBe('wild-shape');
    expect(revertWildShape(shaped).currentHp).toBe(initial.currentHp);
    expect(revertWildShape(shaped).characterStateHistory).toHaveLength(2);
  });
  test('publishes release metadata', () =>
    expect(CURRENT_ITERATION.id).toBe('3.5F'));
});
