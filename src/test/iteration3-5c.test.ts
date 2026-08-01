import { describe, expect, it } from 'vitest';
import {
  applyLevelUp,
  previewLevelUp,
  type LevelUpDraft,
} from '../domain/leveling';
import {
  decreaseMaximumHpAdjustment,
  healDamage,
} from '../application/session/session-commands';
import { performLongRest, performShortRest } from '../domain/rest';
import { defaultRuleRegistry } from '../domain/rules';
import {
  referenceBuild,
  referenceSession,
} from '../features/characters/referenceCharacter';
import { applicationImplementationStatus } from '../application/implementation-status/implementation-status';
import { getAvailableClassSpells } from '../domain/spells';

describe('Iteration 3.5C', () => {
  const level3 = {
    ...referenceBuild,
    abilityScores: { ...referenceBuild.abilityScores, wisdom: 18 },
    totalLevel: 3,
    class: { ...referenceBuild.class!, level: 3 },
    hitPointProgression: {
      ...referenceBuild.hitPointProgression,
      levelGains: referenceBuild.hitPointProgression.levelGains.filter(
        (gain) => gain.level <= 3,
      ),
    },
  };
  const draft: LevelUpDraft = {
    characterId: level3.id,
    fromLevel: 3,
    toLevel: 4,
    hitPointChoice: { type: 'fixed', baseHitPoints: 5 },
    selectedCantripIds: (referenceBuild.cantripIds ?? []).slice(0, 3),
    selectedPreparedSpellIds: getAvailableClassSpells({
      classId: 'druid',
      characterLevel: 4,
      registry: defaultRuleRegistry,
    })
      .filter((spell) => spell.level > 0 && spell.level <= 2)
      .slice(0, 7)
      .map((spell) => spell.id),
    advancementChoice: {
      type: 'ability-score-improvement',
      increases: [{ ability: 'wisdom', amount: 2 }],
    },
  };
  it('applies and previews an ASI without mutating the build', () => {
    const before = level3.abilityScores.wisdom;
    const preview = previewLevelUp(
      level3,
      { ...referenceSession, currentHp: 1, spentSpellSlots: {} },
      draft,
      defaultRuleRegistry,
    );
    expect(preview.diagnostics).toEqual([]);
    expect(preview.after?.abilityModifiers.wisdom.value).toBeGreaterThan(
      preview.before.abilityModifiers.wisdom.value,
    );
    expect(level3.abilityScores.wisdom).toBe(before);
    const result = applyLevelUp(
      level3,
      { ...referenceSession, currentHp: 1, spentSpellSlots: {} },
      draft,
      defaultRuleRegistry,
    );
    expect(result.success && result.build.advancementChoices).toHaveLength(1);
  });
  it('validates duplicate ASI targets and unsupported feats', () => {
    const bad = applyLevelUp(
      level3,
      referenceSession,
      {
        ...draft,
        advancementChoice: {
          type: 'ability-score-improvement',
          increases: [
            { ability: 'wisdom', amount: 1 },
            { ability: 'wisdom', amount: 1 },
          ],
        },
      },
      defaultRuleRegistry,
    );
    expect(
      !bad.success &&
        bad.diagnostics.some((d) => d.type === 'duplicate-asi-target'),
    ).toBe(true);
    const feat = applyLevelUp(
      level3,
      referenceSession,
      {
        ...draft,
        advancementChoice: { type: 'general-feat', featId: 'unsupported' },
      },
      defaultRuleRegistry,
    );
    expect(
      !feat.success &&
        feat.diagnostics.some((d) => d.type === 'invalid-feat-choice'),
    ).toBe(true);
  });
  it('adjusts max HP, clamps current HP, and limits healing', () => {
    const adjusted = decreaseMaximumHpAdjustment(
      { ...referenceSession, currentHp: 20 },
      10,
      20,
      'Necrotic',
    ).session;
    expect(adjusted.currentHp).toBe(10);
    expect(() => healDamage(adjusted, 1, 10)).toThrow();
  });
  it('preserves conditions on short rest and clears them on long rest', () => {
    const input = {
      session: { ...referenceSession, conditions: ['blinded'] },
      registry: defaultRuleRegistry,
      classLevel: 4,
      maximumHp: 20,
      spellSlotMaximums: {},
      activeOwnerIds: ['druid'],
    };
    expect(performShortRest(input).session.conditions).toEqual(['blinded']);
    expect(performLongRest(input).session.conditions).toEqual([]);
  });
  it('publishes the shared implementation status', () => {
    expect(applicationImplementationStatus.iteration).toBe('3.5D');
    expect(applicationImplementationStatus.implementedFeatures).toContain(
      'Maximum HP adjustment',
    );
  });
});
