import { describe, expect, it, vi } from 'vitest';
import {
  SessionCommandError,
  SessionController,
  applyDamage,
  clearConditions,
  endConcentration,
  healDamage,
  removeTemporaryHp,
  restoreResource,
  restoreSpellSlot,
  setCondition,
  setCurrentHp,
  setTemporaryHp,
  spendResource,
  spendSpellSlot,
  startConcentration,
} from '../application/session';
import { referenceSession } from '../features/characters/referenceCharacter';

describe('session commands', () => {
  it('manages hit points and temporary hit points immutably', () => {
    const damaged = applyDamage(referenceSession, 8);
    expect(damaged).not.toBe(referenceSession);
    expect(damaged).toMatchObject({ temporaryHp: 0, currentHp: 42 });
    expect(healDamage(damaged, 4, 62).currentHp).toBe(46);
    expect(setCurrentHp(damaged, 0, 62).currentHp).toBe(0);
    expect(setTemporaryHp(damaged, 7).temporaryHp).toBe(7);
    expect(removeTemporaryHp(damaged).temporaryHp).toBe(0);
    expect(() => setCurrentHp(damaged, 63, 62)).toThrow(SessionCommandError);
    expect(() => healDamage(damaged, 30, 62)).toThrow(SessionCommandError);
  });

  it('spends and restores slots and rule-defined resources safely', () => {
    const slot = spendSpellSlot(referenceSession, 1, 4);
    expect(slot.spentSpellSlots[1]).toBe(3);
    expect(restoreSpellSlot(slot, 1).spentSpellSlots[1]).toBe(2);
    const available = {
      ...referenceSession,
      resources: { ...referenceSession.resources, 'wild-shape': 2 },
    };
    expect(spendResource(available, 'wild-shape').resources['wild-shape']).toBe(
      1,
    );
    expect(
      restoreResource(referenceSession, 'wild-shape', 2).resources[
        'wild-shape'
      ],
    ).toBe(1);
    expect(() => spendResource(referenceSession, 'wild-shape')).toThrow(
      SessionCommandError,
    );
  });

  it('tracks one concentration spell and active condition IDs', () => {
    const concentrating = startConcentration(referenceSession, 'entangle');
    expect(concentrating.concentrationSpellId).toBe('entangle');
    expect(
      endConcentration(concentrating).concentrationSpellId,
    ).toBeUndefined();
    const prone = setCondition(referenceSession, 'prone', true);
    expect(prone.conditions).toEqual(['prone']);
    expect(clearConditions(prone).conditions).toEqual([]);
  });
});

describe('SessionController', () => {
  it('persists, records newest-first history, and supports one-level undo', () => {
    const persist = vi.fn();
    const controller = new SessionController(referenceSession, persist);
    controller.execute((session) => applyDamage(session, 5), 'Took 5 damage');
    controller.execute(
      (session) => setTemporaryHp(session, 2),
      'Set temporary HP',
    );
    expect(controller.state.history.map((entry) => entry.message)).toEqual([
      'Set temporary HP',
      'Took 5 damage',
    ]);
    controller.undoLastSessionChange();
    expect(controller.state.session.temporaryHp).toBe(0);
    expect(controller.state.undoSession).toBeNull();
    expect(persist).toHaveBeenCalledTimes(3);
  });
});
