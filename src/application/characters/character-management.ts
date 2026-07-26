import type { CharacterRecord, CharacterRepository } from './character-repository';
import { computeCharacter } from '../../domain/character';
import { defaultRuleRegistry } from '../../domain/rules';

export async function duplicateCharacter(record: CharacterRecord, repository: CharacterRepository, now = new Date()): Promise<CharacterRecord> {
  const timestamp = now.toISOString();
  const duplicate: CharacterRecord = {
    ...structuredClone(record),
    build: { ...record.build, id: crypto.randomUUID(), name: `${record.build.name} (Copy)` },
    session: {
      ...structuredClone(record.session),
      currentHp: computeCharacter(record.build, record.session, defaultRuleRegistry).maximumHp.value,
      temporaryHp: 0,
      spentSpellSlots: {},
      resources: {},
      conditions: [],
      concentrationSpellId: undefined,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  } as CharacterRecord;
  await repository.save(duplicate);
  return duplicate;
}

export async function deleteCharacter(id: string, repository: CharacterRepository) {
  if (!id || id === 'reference') throw new Error('reference-record-protected');
  await repository.delete(id);
}
