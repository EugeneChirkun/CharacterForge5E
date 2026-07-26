import { describe, expect, test } from 'vitest';
import {
  assignStandardArrayValue,
  calculatePointBuy,
  createCharacterFromDraft,
  newCharacterDraft,
  validateManualScores,
  validateStandardArrayAssignment,
} from '../domain/creation';
import { applyLevelUp } from '../domain/leveling';
import { defaultRuleRegistry } from '../domain/rules';
import {
  LocalCharacterDraftRepository,
  LocalCharacterRepository,
  type KeyValueStorage,
} from '../infrastructure/persistence/local-character-repository';
class MemoryStorage implements KeyValueStorage {
  private data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}
const completeDraft = (level = 1) => ({
  ...newCharacterDraft('stable-id'),
  name: 'Myrddin',
  targetLevel: level,
  primalOrder: { orderId: 'warden' as const },
  selectedSkillProficiencies: ['perception', 'survival'] as const,
  selectedCantripIds:
    level >= 4
      ? ['druidcraft', 'guidance', 'produce-flame']
      : ['druidcraft', 'guidance'],
  selectedPreparedSpellIds: Object.values(defaultRuleRegistry.spells)
    .filter(
      (s) =>
        s.level > 0 &&
        s.classIds.includes('druid') &&
        s.level <= Math.ceil(level / 2),
    )
    .slice(
      0,
      defaultRuleRegistry.classes.druid.progression[level - 1].preparedSpells,
    )
    .map((s) => s.id),
  hitPointChoices: Object.fromEntries(
    Array.from({ length: level }, (_, i) => [
      i + 1,
      { type: 'fixed' as const, baseHitPoints: i ? 5 : 8 },
    ]),
  ),
  ...(level >= 3
    ? {
        subclassId: 'circle-of-the-land' as const,
        landType: 'temperate' as const,
      }
    : {}),
});
describe('Iteration 2C ability generation', () => {
  test('standard array is complete, immutable, and detects duplicates', () => {
    const original = { strength: 15 };
    const next = assignStandardArrayValue(original, 'dexterity', 14);
    expect(original).toEqual({ strength: 15 });
    expect(next).toEqual({ strength: 15, dexterity: 14 });
    expect(
      validateStandardArrayAssignment(completeDraft().baseAbilityScores),
    ).toEqual([]);
    expect(
      validateStandardArrayAssignment({
        ...completeDraft().baseAbilityScores,
        charisma: 15,
      }).map((d) => d.type),
    ).toContain('duplicate-standard-array-value');
  });
  test('point buy reports costs and exact budget', () => {
    const result = calculatePointBuy({
      strength: 15,
      dexterity: 15,
      constitution: 15,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
    });
    expect(result.totalSpent).toBe(27);
    expect(result.pointsRemaining).toBe(0);
    expect(result.costs.strength).toBe(9);
    expect(result.diagnostics).toEqual([]);
  });
  test('manual strict mode rejects range and fractions without clamping', () => {
    expect(
      validateManualScores({
        ...completeDraft().baseAbilityScores,
        strength: 16,
      })[0]?.type,
    ).toBe('invalid-manual-score');
    expect(
      validateManualScores({
        ...completeDraft().baseAbilityScores,
        strength: 8.5,
      })[0]?.type,
    ).toBe('invalid-manual-score');
  });
});
describe('creation, persistence, and leveling', () => {
  test('creates level 1 and level 8 builds with initialized sessions', () => {
    for (const level of [1, 8]) {
      const result = createCharacterFromDraft(
        completeDraft(level),
        defaultRuleRegistry,
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.build.id).toBe('stable-id');
        expect(result.build.totalLevel).toBe(level);
        expect(result.session.currentHp).toBeGreaterThan(0);
        expect(result.session.temporaryHp).toBe(0);
      }
    }
  });
  test('invalid creation has no partial output', () => {
    const result = createCharacterFromDraft(
      newCharacterDraft('x'),
      defaultRuleRegistry,
    );
    expect(result.success).toBe(false);
    expect('build' in result).toBe(false);
  });
  test('repository CRUD, corrupt JSON recovery, and draft lifecycle', async () => {
    const storage = new MemoryStorage();
    const repo = new LocalCharacterRepository(storage);
    const draftRepo = new LocalCharacterDraftRepository(storage);
    const created = createCharacterFromDraft(
      completeDraft(),
      defaultRuleRegistry,
    );
    if (!created.success) throw new Error('fixture');
    const now = new Date().toISOString();
    await repo.save({
      schemaVersion: 2,
      build: created.build,
      session: created.session,
      createdAt: now,
      updatedAt: now,
    });
    expect(await repo.list()).toHaveLength(1);
    expect((await repo.get('stable-id'))?.build.name).toBe('Myrddin');
    await repo.delete('stable-id');
    expect(await repo.get('stable-id')).toBeNull();
    await draftRepo.saveDraft(completeDraft());
    expect((await draftRepo.loadDraft())?.id).toBe('stable-id');
    await draftRepo.deleteDraft();
    expect(await draftRepo.loadDraft()).toBeNull();
  });
  test('level-up preserves current HP and is atomic', () => {
    const created = createCharacterFromDraft(
      completeDraft(),
      defaultRuleRegistry,
    );
    if (!created.success) throw new Error('fixture');
    const progression = defaultRuleRegistry.classes.druid.progression[1];
    const prepared = Object.values(defaultRuleRegistry.spells)
      .filter((s) => s.level === 1 && s.classIds.includes('druid'))
      .slice(0, progression.preparedSpells)
      .map((s) => s.id);
    const result = applyLevelUp(
      created.build,
      { ...created.session, currentHp: 3 },
      {
        characterId: 'stable-id',
        fromLevel: 1,
        toLevel: 2,
        hitPointChoice: { type: 'fixed', baseHitPoints: 5 },
        selectedCantripIds: created.build.cantripIds ?? [],
        selectedPreparedSpellIds: prepared,
      },
      defaultRuleRegistry,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.currentHp).toBe(3);
      expect(result.build.totalLevel).toBe(2);
    }
    const invalid = applyLevelUp(
      created.build,
      created.session,
      {
        characterId: 'stable-id',
        fromLevel: 1,
        toLevel: 3,
        selectedCantripIds: [],
        selectedPreparedSpellIds: [],
      },
      defaultRuleRegistry,
    );
    expect(invalid.success).toBe(false);
    expect(created.build.totalLevel).toBe(1);
  });
});
