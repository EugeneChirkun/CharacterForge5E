import type { CharacterViewModel } from '../../features/characters/character.types';
import { defaultRuleRegistry, type RuleRegistry } from '../../domain/rules';
import { validatePreparedSpells } from '../../domain/spells';
import { SessionCommandError } from '../session';

export function togglePreparedSpell(
  character: CharacterViewModel,
  spellId: string,
  registry: RuleRegistry = defaultRuleRegistry,
): CharacterViewModel {
  const ids = character.preparedSpellIds ?? [];
  if (ids.includes(spellId))
    return {
      ...character,
      preparedSpellIds: ids.filter((id) => id !== spellId),
    };
  const definition = registry.spells[spellId];
  const access = character.spells.find((spell) => spell.id === spellId);
  if (
    !definition ||
    definition.level === 0 ||
    access?.alwaysPrepared ||
    access?.sources.some((s) => s !== 'class')
  )
    throw new SessionCommandError(
      'SPELL_NOT_PREPARABLE',
      'That spell cannot be prepared manually.',
    );
  const level = registry.classes.druid.progression.find(
    (row) => row.level === character.level,
  );
  const result = validatePreparedSpells({
    preparedSpellIds: [...ids, spellId],
    classId: 'druid',
    maximum: level?.preparedSpells ?? 0,
    maximumSpellLevel: Math.max(0, ...character.spellSlots.map((s) => s.level)),
    grants: [],
    registry,
  });
  if (result.diagnostics.length)
    throw new SessionCommandError(
      'INVALID_PREPARED_SPELLS',
      'That spell cannot be prepared.',
    );
  return { ...character, preparedSpellIds: result.validPreparedSpellIds };
}
export function spendSlot(
  character: CharacterViewModel,
  level: number,
): CharacterViewModel {
  return {
    ...character,
    spellSlots: character.spellSlots.map((slot) =>
      slot.level === level && slot.current > 0
        ? { ...slot, current: slot.current - 1 }
        : slot,
    ),
  };
}
export function restoreSlot(
  character: CharacterViewModel,
  level: number,
): CharacterViewModel {
  return {
    ...character,
    spellSlots: character.spellSlots.map((slot) =>
      slot.level === level && slot.current < slot.maximum
        ? { ...slot, current: slot.current + 1 }
        : slot,
    ),
  };
}
