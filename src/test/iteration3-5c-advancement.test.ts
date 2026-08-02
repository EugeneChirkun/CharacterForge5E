import { describe, expect, test } from 'vitest';
import { validateAdvancementChoices } from '../domain/leveling';
import { migratePersistedCharacter } from '../infrastructure/persistence/migrations/migrate-persisted-character';
import {
  referenceBuild,
  referenceSession,
} from '../features/characters/referenceCharacter';

const scores = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 16,
  charisma: 10,
};
const asi = (level: number, ability: 'wisdom' | 'constitution' = 'wisdom') => ({
  classId: 'druid',
  characterLevel: level,
  choice: {
    type: 'ability-score-improvement' as const,
    increases: [{ ability, amount: 2 as const }],
  },
});

describe('Druid advancement milestones', () => {
  test('requires no choice before 4 and ordered choices through 8', () => {
    expect(validateAdvancementChoices('druid', 3, [], scores)).toEqual([]);
    expect(validateAdvancementChoices('druid', 4, [], scores)[0]?.type).toBe(
      'missing-advancement-choice',
    );
    expect(
      validateAdvancementChoices('druid', 8, [asi(4), asi(8)], scores),
    ).toEqual([]);
  });

  test('rejects duplicate targets and the cumulative score cap', () => {
    expect(
      validateAdvancementChoices('druid', 4, [asi(4), asi(4)], scores).some(
        (item) => item.type === 'invalid-advancement-choice',
      ),
    ).toBe(true);
    expect(
      validateAdvancementChoices('druid', 8, [asi(4), asi(8)], {
        ...scores,
        wisdom: 18,
      }).some((item) => item.type === 'ability-score-cap-exceeded'),
    ).toBe(true);
  });

  test('reference fixture records both source decisions', () => {
    expect(
      referenceBuild.advancementChoices?.map((item) => item.characterLevel),
    ).toEqual([4, 8]);
    expect(referenceBuild.abilityScores.wisdom).toBe(20);
  });

  test('migration marks missing choices without changing session state', () => {
    const input = {
      schemaVersion: 4,
      build: { ...referenceBuild, id: 'user', advancementChoices: undefined },
      session: referenceSession,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    const result = migratePersistedCharacter(input);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(
      result.record.build.requiredBuildChoices
        ?.slice(-2)
        .map((item) => item.choiceId),
    ).toEqual(['druid.advancement.4', 'druid.advancement.8']);
    expect(result.record.session.currentHp).toBe(referenceSession.currentHp);
    expect(result.record.session.inventory).toEqual(referenceSession.inventory);
  });

  test('danger palette exposes semantic accessible states', async () => {
    const css = await import('../styles/tokens.css?raw').then(
      (module) => module.default,
    );
    expect(css).toContain('--color-danger: #d91e18');
    expect(css).toContain('--color-danger-text: #ffffff');
    expect(css).toContain('--color-danger-hover:');
    expect(css).toContain('--color-danger-focus:');
    expect(css).toContain('--color-danger-disabled-bg:');
  });
});
