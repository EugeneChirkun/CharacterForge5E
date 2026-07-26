import {
  abilityNames,
  getAbilityModifier,
  type AbilityName,
} from '../abilities';
import { calculateArmorClass } from '../armor-class';
import { calculateMaximumHp } from '../hit-points';
import { getProficiencyBonus } from '../proficiency';
import {
  calculateSkillModifier,
  skillNames,
  skillToAbility,
  type SkillName,
} from '../skills';
import {
  calculateSpellAttackBonus,
  calculateSpellSaveDc,
  calculateSpellSlots,
} from '../spellcasting';
import {
  calculateInitiative,
  calculatePassivePerception,
  calculateSavingThrow,
} from './statistics';
import type {
  CharacterBuild,
  CharacterSession,
  ComputedCharacter,
} from './models';
import { validateCharacterSession } from './session';
import { emptyInventory, selectEquipment } from '../equipment';
import {
  defaultRuleRegistry,
  type RuleDiagnostic,
  type RuleRegistry,
} from '../rules';
import { resolveResources } from '../resources';
import {
  activeSpellGrants,
  maximumSpellLevel,
  validatePreparedSpells,
  sortSpells,
} from '../spells';

export function computeCharacter(
  build: CharacterBuild,
  session: CharacterSession,
  registry: RuleRegistry = defaultRuleRegistry,
): ComputedCharacter {
  const ruleDiagnostics: RuleDiagnostic[] = [];
  const classId = build.class?.classId;
  const classDefinition = classId ? registry.classes[classId] : undefined;
  if (classId && !classDefinition)
    ruleDiagnostics.push({
      type: 'unknown-rule-id',
      category: 'class',
      id: classId,
    });
  const level = build.class?.level ?? build.totalLevel;
  const classLevel = classDefinition?.progression.find(
    (p) => p.level === level,
  );
  if (classDefinition && !classLevel)
    ruleDiagnostics.push({ type: 'unsupported-character-level', value: level });
  const subclassId = build.class?.subclassId;
  const subclass = subclassId ? registry.subclasses[subclassId] : undefined;
  if (subclassId && !subclass)
    ruleDiagnostics.push({
      type: 'unknown-rule-id',
      category: 'subclass',
      id: subclassId,
    });
  if (subclass && subclass.parentClassId !== classId)
    ruleDiagnostics.push({
      type: 'subclass-does-not-belong-to-class',
      subclassId: subclass.id,
      classId: classId ?? '',
    });
  if (subclass && level < subclass.unlockLevel)
    ruleDiagnostics.push({
      type: 'subclass-selected-before-unlock',
      subclassId: subclass.id,
      level,
    });
  const speciesId = build.species?.speciesId;
  const species = speciesId ? registry.species[speciesId] : undefined;
  if (speciesId && !species)
    ruleDiagnostics.push({
      type: 'unknown-rule-id',
      category: 'species',
      id: speciesId,
    });
  const optionId = build.species?.optionId;
  const option = optionId ? registry.speciesOptions[optionId] : undefined;
  if (optionId && !option)
    ruleDiagnostics.push({
      type: 'unknown-rule-id',
      category: 'species-option',
      id: optionId,
    });
  const background = build.backgroundId
    ? registry.backgrounds[build.backgroundId]
    : undefined;
  if (build.backgroundId && !background)
    ruleDiagnostics.push({
      type: 'unknown-rule-id',
      category: 'background',
      id: build.backgroundId,
    });
  const featIds = build.featIds ?? build.feats.map((f) => f.toLowerCase());
  for (const id of featIds)
    if (!registry.feats[id])
      ruleDiagnostics.push({ type: 'unknown-rule-id', category: 'feat', id });
  const abilityModifiers = Object.fromEntries(
    abilityNames.map((ability) => [
      ability,
      getAbilityModifier(build.abilityScores[ability]),
    ]),
  ) as Record<AbilityName, ReturnType<typeof getAbilityModifier>>;
  const proficiencyBonus = getProficiencyBonus(build.totalLevel);
  const savingThrows = Object.fromEntries(
    abilityNames.map((ability) => [
      ability,
      calculateSavingThrow({
        abilityModifier: abilityModifiers[ability].value,
        proficiencyBonus: proficiencyBonus.value,
        proficient: build.savingThrowProficiencies.includes(ability),
      }),
    ]),
  ) as ComputedCharacter['savingThrows'];
  const skills = Object.fromEntries(
    skillNames.map((skill) => [
      skill,
      calculateSkillModifier({
        skill,
        abilityModifier: abilityModifiers[skillToAbility[skill]].value,
        proficiencyBonus: proficiencyBonus.value,
        proficient: build.skillProficiencies.includes(skill),
        expertise: build.expertiseSkills.includes(skill),
      }),
    ]),
  ) as Record<SkillName, ReturnType<typeof calculateSkillModifier>>;
  const initiative = calculateInitiative({
    dexterityModifier: abilityModifiers.dexterity.value,
  });
  const passivePerception = calculatePassivePerception(skills.perception);
  const equipment = selectEquipment(session.inventory ?? emptyInventory());
  const armorClass = calculateArmorClass({
    sources: session.inventory
      ? [
          {
            type: 'unarmored' as const,
            base: 10,
            abilityModifiers: ['dexterity' as const],
            label: 'Unarmored',
          },
          ...equipment.armorClassSources,
        ]
      : build.armorClassSources,
    abilityModifiers: Object.fromEntries(
      abilityNames.map((name) => [name, abilityModifiers[name].value]),
    ) as Record<AbilityName, number>,
  });
  const toughBonus = featIds
    .flatMap((id) => registry.feats[id]?.featureIds ?? [])
    .flatMap((id) => registry.features[id]?.effects ?? [])
    .filter((e) => e.type === 'modify-hit-points-per-level')
    .reduce((n, e) => n + e.amount, 0);
  const maximumHp = calculateMaximumHp({
    level: build.totalLevel,
    constitutionModifier: abilityModifiers.constitution.value,
    progression: {
      ...build.hitPointProgression,
      perLevelBonuses: [
        ...build.hitPointProgression.perLevelBonuses,
        ...(toughBonus &&
        !build.hitPointProgression.perLevelBonuses.some((x) =>
          x.source.toLowerCase().includes('tough'),
        )
          ? [{ source: 'Tough feat rule', amount: toughBonus }]
          : []),
      ],
    },
  });
  validateCharacterSession(session, maximumHp.value);
  const spellcasting = build.spellcasting
    ? (() => {
        const abilityModifier = abilityModifiers[build.spellcasting.ability];
        return {
          ability: build.spellcasting.ability,
          abilityModifier,
          spellSaveDc: calculateSpellSaveDc({
            proficiencyBonus: proficiencyBonus.value,
            abilityModifier: abilityModifier.value,
          }),
          spellAttackBonus: calculateSpellAttackBonus({
            proficiencyBonus: proficiencyBonus.value,
            abilityModifier: abilityModifier.value,
          }),
          slots: calculateSpellSlots({
            level: build.totalLevel,
            progression: build.spellcasting.slotProgression,
            spent: session.spentSpellSlots,
          }),
        };
      })()
    : undefined;
  const landType = session.selections?.circleOfTheLand?.landType;
  if (subclassId === 'circle-of-the-land' && !landType)
    ruleDiagnostics.push({ type: 'missing-required-land-selection' });
  const ownerIds = [
    classId,
    subclassId,
    speciesId,
    optionId,
    ...featIds,
  ].filter((x): x is string => !!x);
  const resolvedResources = resolveResources(
    registry,
    level,
    session.resources,
    ownerIds,
  );
  for (const resourceId of resolvedResources.invalid) {
    const r = resolvedResources.resources.find((x) => x.id === resourceId)!;
    ruleDiagnostics.push({
      type: 'invalid-resource-state',
      resourceId,
      remaining: r.remaining,
      maximum: r.maximum,
    });
  }
  const featureIds = [
    ...(classLevel?.featureIds ?? []),
    ...(subclass && level >= subclass.unlockLevel
      ? subclass.featureIds.filter(
          (id) => (registry.features[id]?.level ?? 99) <= level,
        )
      : []),
    ...(species?.featureIds ?? []),
    ...(option?.featureIds ?? []),
    ...(background?.featureIds ?? []),
    ...featIds.flatMap((id) => registry.feats[id]?.featureIds ?? []),
  ];
  const activeFeatures = [...new Set(featureIds)]
    .map((id) => registry.features[id])
    .filter((x): x is NonNullable<typeof x> => !!x && x.source.verified)
    .map((f) => ({
      id: f.id,
      name: f.name,
      sourceType: f.ownerType,
      sourceId: f.ownerId,
      summary: f.summary,
    }));
  const grants = activeSpellGrants(registry, level, landType).filter(
    (g) =>
      (g.sourceType === 'subclass' && subclassId === g.sourceId) ||
      (g.sourceType === 'species' && optionId === g.sourceId),
  );
  const preparation = classLevel
    ? validatePreparedSpells({
        preparedSpellIds:
          session.preparedSpellIds ?? build.preparedSpellIds ?? [],
        classId: classId ?? '',
        maximum: classLevel.preparedSpells,
        maximumSpellLevel: maximumSpellLevel(classLevel.spellSlots),
        grants,
        registry,
      })
    : {
        validPreparedSpellIds: [],
        alwaysPreparedSpellIds: [],
        grantedSpellIds: [],
        diagnostics: [],
      };
  const accesses = new Map<string, ComputedCharacter['spells'][number]>();
  for (const id of [
    ...(build.cantripIds ?? []),
    ...preparation.validPreparedSpellIds,
  ]) {
    const s = registry.spells[id];
    if (s)
      accesses.set(id, {
        spellId: id,
        name: s.name,
        level: s.level,
        sourceTypes: ['class'],
        prepared: true,
        alwaysPrepared: false,
        available: true,
        mayUseSpellSlots: s.level > 0,
        castingAbility: classDefinition?.spellcastingAbility ?? 'wisdom',
      });
  }
  for (const g of grants) {
    const s = registry.spells[g.spellId];
    if (!s) continue;
    const prior = accesses.get(g.spellId);
    accesses.set(g.spellId, {
      spellId: g.spellId,
      name: s.name,
      level: s.level,
      sourceTypes: [...new Set([...(prior?.sourceTypes ?? []), g.sourceType])],
      prepared: true,
      alwaysPrepared: g.alwaysPrepared || prior?.alwaysPrepared === true,
      available: true,
      freeUsesRemaining: g.freeUseResourceId
        ? resolvedResources.resources.find((r) => r.id === g.freeUseResourceId)
            ?.remaining
        : prior?.freeUsesRemaining,
      mayUseSpellSlots: g.mayUseSpellSlots || prior?.mayUseSpellSlots === true,
      castingAbility: build.species?.spellcastingAbility ?? g.castingAbility,
    });
  }
  return {
    abilityModifiers,
    proficiencyBonus,
    savingThrows,
    skills,
    initiative,
    passivePerception,
    armorClass,
    equipment: {
      equippedArmor: equipment.equippedArmor,
      equippedShield: equipment.equippedShield,
      equippedWeapons: equipment.equippedWeapons,
      equippedFocus: equipment.equippedFocus,
      carriedWeight: equipment.carriedWeight,
      ownedWeight: equipment.ownedWeight,
      diagnostics: equipment.diagnostics,
      armorClassSteps: [
        ...equipment.armorClassSteps,
        ...armorClass.steps.map((step) => step.label),
      ],
    },
    maximumHp,
    currentHp: session.currentHp,
    temporaryHp: session.temporaryHp,
    spellcasting,
    classLevel: classLevel
      ? {
          level,
          cantripsKnown: classLevel.cantripsKnown,
          preparedSpells: classLevel.preparedSpells,
          maximumSpellLevel: maximumSpellLevel(classLevel.spellSlots),
        }
      : undefined,
    activeFeatures,
    activeResources: resolvedResources.resources,
    spells: sortSpells(
      [...accesses.values()].map((spell) => ({
        ...spell,
        id: spell.spellId,
      })),
    ),
    spellDiagnostics: preparation.diagnostics,
    ruleDiagnostics,
    activeLandType: landType,
  };
}
