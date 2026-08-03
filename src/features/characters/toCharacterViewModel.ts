import { abilityNames } from '../../domain/abilities';
import {
  computeCharacter,
  type CharacterBuild,
  type CharacterSession,
} from '../../domain/character';
import type { RuleRegistry } from '../../domain/rules';
import { skillNames } from '../../domain/skills';
import type { CharacterViewModel } from './character.types';
import { emptyInventory } from '../../domain/equipment';
import { beastRegistry } from '../../domain/character-state';
export function toCharacterViewModel(
  build: CharacterBuild,
  session: CharacterSession,
  registry: RuleRegistry,
): CharacterViewModel {
  const c = computeCharacter(build, session, registry);
  const beast =
    c.activeState.type === 'wild-shape'
      ? beastRegistry[c.activeState.payload.beastId]
      : undefined;
  return {
    characterState: c.activeState,
    characterStateHistory: session.characterStateHistory ?? [],
    availableWildShapeForms: c.availableWildShapeForms,
    id: build.id,
    name: build.name,
    level: build.totalLevel,
    primalOrder: c.druid?.primalOrder
      ? {
          name: c.druid.primalOrder.name,
          additionalCantrip: c.druid.primalOrder.additionalCantripId
            ? registry.spells[c.druid.primalOrder.additionalCantripId]?.name
            : undefined,
          skillBonusTarget: c.druid.primalOrder.skillBonusTarget,
          grantedProficiencies: c.druid.primalOrder.grantedProficiencies,
        }
      : undefined,
    species: 'Tiefling',
    legacy: 'Chthonic',
    characterClass: 'Druid',
    subclass: build.class?.subclassId
      ? 'Circle of the Land'
      : 'Not yet selected',
    background: 'Farmer',
    landType: c.activeLandType ?? 'temperate',
    speed: beast?.speedFeet ?? 30,
    armorClass: beast?.armorClass ?? c.armorClass.value,
    baseArmorClass: c.armorClass.value,
    baseSpeed: 30,
    initiative: c.initiative.value,
    proficiencyBonus: c.proficiencyBonus.value,
    currentHp: c.currentHp,
    maximumHp: Math.max(
      0,
      c.maximumHp.value + (session.maximumHpAdjustment ?? 0),
    ),
    baseMaximumHp: c.maximumHp.value,
    maximumHpAdjustment: session.maximumHpAdjustment ?? 0,
    maximumHpAdjustmentReason: session.maximumHpAdjustmentReason,
    temporaryHp: c.temporaryHp,
    hitDice: `${build.totalLevel}d8`,
    passivePerception: c.passivePerception.value,
    spellSaveDc: c.spellcasting?.spellSaveDc.value ?? 0,
    spellAttackBonus: c.spellcasting?.spellAttackBonus.value ?? 0,
    abilities: Object.fromEntries(
      abilityNames.map((a) => [
        a,
        {
          score:
            beast && ['strength', 'dexterity', 'constitution'].includes(a)
              ? beast.abilityScores[a]
              : build.abilityScores[a],
          modifier:
            beast && ['strength', 'dexterity', 'constitution'].includes(a)
              ? Math.floor((beast.abilityScores[a] - 10) / 2)
              : c.abilityModifiers[a].value,
          savingThrow: c.savingThrows[a].value,
          proficientInSave: build.savingThrowProficiencies.includes(a),
        },
      ]),
    ) as CharacterViewModel['abilities'],
    baseAbilities: Object.fromEntries(
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
      { category: 'Armor', items: c.proficiencies.armor },
      { category: 'Weapons', items: c.proficiencies.weapons },
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
      recoveryOn: r.recovery,
    })),
    features: c.activeFeatures,
    spells: c.spells.map((s) => ({
      id: s.spellId,
      name: s.name,
      level: s.level,
      sources: s.sourceTypes,
      alwaysPrepared: s.alwaysPrepared,
    })),
    diagnosticGroups: {
      build: c.ruleDiagnostics.map((d) => d.type),
      spellPreparation: c.spellDiagnostics.map((d) => d.type),
      session: c.equipment.diagnostics.map((d) => d.type),
    },
    diagnostics: [
      ...c.ruleDiagnostics.map((d) => d.type),
      ...c.spellDiagnostics.map((d) => d.type),
      ...c.equipment.diagnostics.map((d) => d.type),
    ],
    conditions: session.conditions,
    concentrationSpellId: session.concentrationSpellId,
    preparedSpellIds: session.preparedSpellIds ?? build.preparedSpellIds ?? [],
    inventory: session.inventory ?? emptyInventory(),
    carriedWeight: c.equipment.carriedWeight,
    ownedWeight: c.equipment.ownedWeight,
    armorClassExplanation: c.equipment.armorClassSteps,
  };
}
