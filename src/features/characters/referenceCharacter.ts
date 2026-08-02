import { abilityNames } from '../../domain/abilities';
import {
  computeCharacter,
  type CharacterBuild,
  type CharacterSession,
} from '../../domain/character';
import { skillNames } from '../../domain/skills';
import type { CharacterViewModel } from './character.types';
import { defaultRuleRegistry } from '../../domain/rules';
import { startingInventory } from '../../domain/equipment';

const toughPerLevel = defaultRuleRegistry.features['tough-durability'].effects
  .filter((effect) => effect.type === 'modify-hit-points-per-level')
  .map((effect) => ({ source: 'Tough feat rule', amount: effect.amount }));

export const referenceBuild: CharacterBuild = {
  id: 'reference',
  name: 'Reference Character',
  ruleset: '5e-2024',
  totalLevel: 8,
  advancementChoices: [
    {
      characterLevel: 4,
      classId: 'druid',
      choice: {
        type: 'ability-score-improvement',
        increases: [{ ability: 'wisdom', amount: 2 }],
      },
    },
    {
      characterLevel: 8,
      classId: 'druid',
      choice: {
        type: 'ability-score-improvement',
        increases: [{ ability: 'wisdom', amount: 2 }],
      },
    },
  ],
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 17,
    intelligence: 10,
    wisdom: 20,
    charisma: 8,
  },
  hitPointProgression: {
    hitDie: 8,
    levelGains: Array.from({ length: 8 }, (_, index) => ({
      level: index + 1,
      baseHitPoints: index === 0 ? 8 : 5,
    })),
    perLevelBonuses: toughPerLevel,
    flatBonuses: [],
  },
  savingThrowProficiencies: ['intelligence', 'wisdom'],
  skillProficiencies: ['animalHandling', 'nature', 'perception'],
  expertiseSkills: [],
  armorClassSources: [],
  spellcasting: {
    ability: 'wisdom',
    slotProgression: {
      1: { 1: 2 },
      2: { 1: 3 },
      3: { 1: 4, 2: 2 },
      4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 },
      6: { 1: 4, 2: 3, 3: 3 },
      7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 },
    },
  },
  feats: ['Tough'],
  class: {
    classId: 'druid',
    level: 8,
    subclassId: 'circle-of-the-land',
    primalOrder: { orderId: 'warden' },
  },
  species: {
    speciesId: 'tiefling',
    optionId: 'chthonic',
    spellcastingAbility: 'wisdom',
  },
  backgroundId: 'farmer',
  featIds: ['tough'],
  cantripIds: ['druidcraft', 'guidance', 'produce-flame'],
  preparedSpellIds: [
    'animal-friendship',
    'cure-wounds',
    'entangle',
    'faerie-fire',
    'goodberry',
    'healing-word',
    'speak-with-animals',
    'barkskin',
    'lesser-restoration',
    'moonbeam',
    'pass-without-trace',
    'call-lightning',
  ],
};
export const referenceSession: CharacterSession = {
  currentHp: 46,
  temporaryHp: 4,
  spentHitDice: 0,
  spentSpellSlots: { 1: 2, 2: 2, 3: 1, 4: 2 },
  resources: {
    'wild-shape': 0,
    'chthonic-false-life-use': 0,
    'chthonic-ray-of-enfeeblement-use': 0,
  },
  conditions: [],
  inventory: startingInventory(),
  selections: { circleOfTheLand: { landType: 'temperate' } },
};

const computed = computeCharacter(referenceBuild, referenceSession);
export const referenceCharacter: CharacterViewModel = {
  id: referenceBuild.id,
  name: referenceBuild.name,
  level: referenceBuild.totalLevel,
  primalOrder: {
    name: 'Warden',
    grantedProficiencies: ['Medium armor', 'Martial weapons'],
  },
  species: 'Tiefling',
  legacy: 'Chthonic',
  characterClass: 'Druid',
  subclass: 'Circle of the Land',
  background: 'Farmer',
  landType: 'temperate',
  speed: 30,
  armorClass: computed.armorClass.value,
  initiative: computed.initiative.value,
  proficiencyBonus: computed.proficiencyBonus.value,
  currentHp: computed.currentHp,
  maximumHp: computed.maximumHp.value,
  temporaryHp: computed.temporaryHp,
  hitDice: '8d8',
  passivePerception: computed.passivePerception.value,
  spellSaveDc: computed.spellcasting?.spellSaveDc.value ?? 0,
  spellAttackBonus: computed.spellcasting?.spellAttackBonus.value ?? 0,
  abilities: Object.fromEntries(
    abilityNames.map((name) => [
      name,
      {
        score: referenceBuild.abilityScores[name],
        modifier: computed.abilityModifiers[name].value,
        savingThrow: computed.savingThrows[name].value,
        proficientInSave:
          referenceBuild.savingThrowProficiencies.includes(name),
      },
    ]),
  ) as CharacterViewModel['abilities'],
  skills: Object.fromEntries(
    skillNames.map((name) => [name, computed.skills[name].value]),
  ) as CharacterViewModel['skills'],
  skillProficiencies: referenceBuild.skillProficiencies,
  proficiencies: [
    { category: 'Armor', items: ['Light Armor', 'Medium Armor'] },
    { category: 'Weapons', items: computed.proficiencies.weapons },
    { category: 'Tools', items: ['Herbalism Kit'] },
  ],
  languages: ['Common', 'Infernal', 'Druidic'],
  senses: ['Darkvision'],
  spellSlots: Object.values(computed.spellcasting?.slots ?? {}).map((slot) => ({
    level: slot.level,
    current: slot.remaining,
    maximum: slot.maximum,
  })),
  resources: [
    ...computed.activeResources.map((r) => ({
      id: r.id,
      name: r.name,
      current: r.remaining,
      maximum: r.maximum,
      recovery: r.recovery.includes('short')
        ? ('short' as const)
        : ('long' as const),
      recoveryOn: r.recovery,
    })),
    {
      id: 'nature-aid',
      name: 'Legacy saved resource',
      current: 0,
      maximum: 1,
      recovery: 'long',
    },
  ],
  features: computed.activeFeatures,
  spells: computed.spells.map((s) => ({
    id: s.spellId,
    name: s.name,
    level: s.level,
    sources: s.sourceTypes,
    alwaysPrepared: s.alwaysPrepared,
  })),
  diagnostics: [
    ...computed.ruleDiagnostics.map((d) => d.type),
    ...computed.spellDiagnostics.map((d) => d.type),
  ],
  diagnosticGroups: {
    build: computed.ruleDiagnostics.map((d) => d.type),
    spellPreparation: computed.spellDiagnostics.map((d) => d.type),
    session: [],
  },
  conditions: referenceSession.conditions,
  preparedSpellIds: referenceBuild.preparedSpellIds,
  inventory: referenceSession.inventory!,
  carriedWeight: computed.equipment.carriedWeight,
  ownedWeight: computed.equipment.ownedWeight,
  armorClassExplanation: computed.equipment.armorClassSteps,
};
export const freshReferenceCharacter = () =>
  structuredClone(referenceCharacter);
