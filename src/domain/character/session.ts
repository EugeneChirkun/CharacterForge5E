import { CharacterValidationError } from '../calculation';
import type { CharacterSession } from './models';
export function updateCharacterSession(
  session: CharacterSession,
  patch: Partial<CharacterSession>,
): CharacterSession {
  return {
    ...session,
    ...patch,
    spentSpellSlots: patch.spentSpellSlots
      ? { ...patch.spentSpellSlots }
      : session.spentSpellSlots,
    resources: patch.resources ? { ...patch.resources } : session.resources,
    conditions: patch.conditions ? [...patch.conditions] : session.conditions,
    preparedSpellIds: patch.preparedSpellIds
      ? [...patch.preparedSpellIds]
      : session.preparedSpellIds,
  };
}
export function validateCharacterSession(
  session: CharacterSession,
  maximumHp: number,
): void {
  if (
    !Number.isInteger(session.currentHp) ||
    session.currentHp < 0 ||
    session.currentHp > maximumHp ||
    !Number.isInteger(session.temporaryHp) ||
    session.temporaryHp < 0
  )
    throw new CharacterValidationError(
      'INVALID_CURRENT_HP',
      'Current HP must be within maximum HP and temporary HP must be non-negative.',
    );
}
