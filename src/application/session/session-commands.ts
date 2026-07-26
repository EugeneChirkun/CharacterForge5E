import type { CharacterSession } from '../../domain/character';
import type { PreparedSpellValidation } from '../../domain/spells';

export const conditionIds = [
  'blinded',
  'charmed',
  'deafened',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
] as const;
export type ConditionId = (typeof conditionIds)[number];

export class SessionCommandError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
const integer = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 0)
    throw new SessionCommandError(
      'INVALID_AMOUNT',
      `${label} must be a non-negative whole number.`,
    );
};
const hp = (
  session: CharacterSession,
  currentHp: number,
): CharacterSession => ({ ...session, currentHp });

export function setCurrentHp(
  session: CharacterSession,
  value: number,
  maximum: number,
) {
  integer(value, 'Current HP');
  if (value > maximum)
    throw new SessionCommandError(
      'HP_ABOVE_MAXIMUM',
      'Current HP cannot exceed maximum HP.',
    );
  return hp(session, value);
}
export function applyDamage(session: CharacterSession, amount: number) {
  integer(amount, 'Damage');
  const absorbed = Math.min(session.temporaryHp, amount);
  return {
    ...session,
    temporaryHp: session.temporaryHp - absorbed,
    currentHp: Math.max(0, session.currentHp - (amount - absorbed)),
  };
}
export function healDamage(
  session: CharacterSession,
  amount: number,
  maximum: number,
) {
  integer(amount, 'Healing');
  if (session.currentHp + amount > maximum)
    throw new SessionCommandError(
      'HP_ABOVE_MAXIMUM',
      'Healing would exceed maximum HP.',
    );
  return hp(session, session.currentHp + amount);
}
export function setTemporaryHp(session: CharacterSession, value: number) {
  integer(value, 'Temporary HP');
  return { ...session, temporaryHp: value };
}
export const removeTemporaryHp = (
  session: CharacterSession,
): CharacterSession => ({ ...session, temporaryHp: 0 });

export function spendSpellSlot(
  session: CharacterSession,
  level: number,
  maximum: number,
) {
  integer(level, 'Spell level');
  const spent = session.spentSpellSlots[level] ?? 0;
  if (spent >= maximum)
    throw new SessionCommandError(
      'NO_SPELL_SLOTS',
      `No Level ${level} spell slots remain.`,
    );
  return {
    ...session,
    spentSpellSlots: { ...session.spentSpellSlots, [level]: spent + 1 },
  };
}
export function restoreSpellSlot(session: CharacterSession, level: number) {
  const spent = session.spentSpellSlots[level] ?? 0;
  if (spent <= 0)
    throw new SessionCommandError(
      'SPELL_SLOTS_FULL',
      `Level ${level} spell slots are already full.`,
    );
  return {
    ...session,
    spentSpellSlots: { ...session.spentSpellSlots, [level]: spent - 1 },
  };
}
export function spendResource(session: CharacterSession, id: string) {
  const remaining = session.resources[id];
  if (remaining === undefined || remaining <= 0)
    throw new SessionCommandError(
      'NO_RESOURCE_USES',
      `No uses of ${id} remain.`,
    );
  return {
    ...session,
    resources: { ...session.resources, [id]: remaining - 1 },
  };
}
export function restoreResource(
  session: CharacterSession,
  id: string,
  maximum: number,
) {
  const remaining = session.resources[id] ?? maximum;
  if (remaining >= maximum)
    throw new SessionCommandError('RESOURCE_FULL', `${id} is already full.`);
  return {
    ...session,
    resources: { ...session.resources, [id]: remaining + 1 },
  };
}

export function prepareSpell(
  session: CharacterSession,
  spellId: string,
  validate: (ids: readonly string[]) => PreparedSpellValidation,
  defaults: readonly string[] = [],
) {
  const ids = [...(session.preparedSpellIds ?? defaults), spellId];
  const result = validate(ids);
  if (result.diagnostics.length)
    throw new SessionCommandError(
      'INVALID_PREPARED_SPELLS',
      'That spell cannot be prepared.',
    );
  return { ...session, preparedSpellIds: result.validPreparedSpellIds };
}
export function unprepareSpell(
  session: CharacterSession,
  spellId: string,
  defaults: readonly string[] = [],
) {
  return {
    ...session,
    preparedSpellIds: (session.preparedSpellIds ?? defaults).filter(
      (id) => id !== spellId,
    ),
  };
}
export const startConcentration = (
  session: CharacterSession,
  spellId: string,
): CharacterSession => {
  if (!spellId)
    throw new SessionCommandError(
      'INVALID_SPELL',
      'Choose a spell to concentrate on.',
    );
  return { ...session, concentrationSpellId: spellId };
};
export const endConcentration = (
  session: CharacterSession,
): CharacterSession => ({ ...session, concentrationSpellId: undefined });
export function setCondition(
  session: CharacterSession,
  condition: ConditionId,
  active: boolean,
) {
  const conditions = new Set(session.conditions);
  if (active) conditions.add(condition);
  else conditions.delete(condition);
  return { ...session, conditions: [...conditions] };
}
export const clearConditions = (
  session: CharacterSession,
): CharacterSession => ({ ...session, conditions: [] });
