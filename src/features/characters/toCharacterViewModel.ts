import { abilityNames } from '../../domain/abilities';
import {
  computeCharacter,
  type CharacterBuild,
  type CharacterSession,
} from '../../domain/character';
import type { RuleRegistry } from '../../domain/rules';
import { skillNames } from '../../domain/skills';
import type { CharacterViewModel } from './character.types';
export function toCharacterViewModel(
  build: CharacterBuild,
  session: CharacterSession,
  registry: RuleRegistry,
): CharacterViewModel {
  const c = computeCharacter(build, session, registry);
  return {
    id: build.id,
    name: build.name,
    level: build.totalLevel,
    species: 'Tiefling',
    legacy: 'Chthonic',
    characterClass: 'Druid',
    subclass: build.class?.subclassId
      ? 'Circle of the Land'
      : 'Not yet selected',
    background: 'Farmer',
    landType: c.activeLandType ?? 'temperate',
    speed: 30,
    armorClass: c.armorClass.value,
    initiative: c.initiative.value,
    proficiencyBonus: c.proficiencyBonus.value,
    currentHp: c.currentHp,
    maximumHp: c.maximumHp.value,
    temporaryHp: c.temporaryHp,
    hitDice: `${build.totalLevel}d8`,
    passivePerception: c.passivePerception.value,
    spellSaveDc: c.spellcasting?.spellSaveDc.value ?? 0,
    spellAttackBonus: c.spellcasting?.spellAttackBonus.value ?? 0,
    abilities: Object.fromEntries(
      abilityNames.map((a) => [
        a,
        {
          score: build.abilityScores[a],
          modifier: c.abilityModifiers[a].value,
          savingThrow: c.savingThrows[a].value,
          proficientInSave: build.savingThrowProficiencies.includes(a),
        },
      ]),
    ) as CharacterViewModel['abilities'],
    skills: Object.fromEntries(
      skillNames.map((s) => [s, c.skills[s].value]),
    ) as CharacterViewModel['skills'],
    skillProficiencies: build.skillProficiencies,
    proficiencies: [
      { category: 'Armor', items: ['Light Armor'] },
      { category: 'Tools', items: ['Herbalism Kit'] },
    ],
    languages: ['Common', 'Infernal', 'Druidic'],
    senses: ['Darkvision'],
    spellSlots: Object.values(c.spellcasting?.slots ?? {}).map((s) => ({
      level: s.level,
      current: s.remaining,
      maximum: s.maximum,
    })),
    resources: c.activeResources.map((r) => ({
      id: r.id,
      name: r.name,
      current: r.remaining,
      maximum: r.maximum,
      recovery: r.recovery.includes('short') ? 'short' : 'long',
    })),
    features: c.activeFeatures,
    spells: c.spells.map((s) => ({
      id: s.spellId,
      name: s.name,
      level: s.level,
      sources: s.sourceTypes,
      alwaysPrepared: s.alwaysPrepared,
    })),
    diagnostics: [
      ...c.ruleDiagnostics.map((d) => d.type),
      ...c.spellDiagnostics.map((d) => d.type),
    ],
  };
}
