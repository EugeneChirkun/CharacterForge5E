import { describe, expect, it } from 'vitest';
import {
  generalFeatRegistry,
  evaluateChoiceDefinition,
  reconcileFeatChoices,
} from '../domain/feats';
import {
  equipmentPackageRegistry,
  equipmentRegistry,
  findPackageDuplicateWarning,
  hasEquipmentCapability,
  materializeEquipmentPackage,
  summarizeEquipmentPackage,
} from '../domain/equipment';
import { referenceBuild } from '../features/characters/referenceCharacter';

describe('Iteration 3.5E', () => {
  it('filters Skill Expert choices in the rules layer and clears collisions', () => {
    const build = {
      ...referenceBuild,
      skillProficiencies: ['nature', 'survival'],
      expertiseSkills: ['nature'],
    } as typeof referenceBuild;
    const feat = generalFeatRegistry['skill-expert'];
    const expertise = feat.choices.find(
      (choice) => choice.id === 'expertiseSkill',
    )!;
    const result = evaluateChoiceDefinition(expertise, {
      build,
      selections: { skill: 'arcana', expertiseSkill: 'arcana' },
    });
    expect(result.options.map((option) => option.id)).toEqual(['survival']);
    expect(
      reconcileFeatChoices(feat.choices, build, {
        skill: 'arcana',
        expertiseSkill: 'arcana',
      }).choices.expertiseSkill,
    ).toBeUndefined();
  });

  it('models Quarterstaff once with weapon and focus capabilities', () => {
    expect(equipmentRegistry['druidic-focus-quarterstaff']).toBeUndefined();
    expect(
      hasEquipmentCapability(equipmentRegistry.quarterstaff, 'weapon'),
    ).toBe(true);
    expect(
      hasEquipmentCapability(
        equipmentRegistry.quarterstaff,
        'spellcasting-focus',
      ),
    ).toBe(true);
  });

  it('derives Explorer pack totals, warnings, and sourced materialization', () => {
    const pack = equipmentPackageRegistry['explorers-pack'];
    expect(summarizeEquipmentPackage(pack)).toEqual({
      totalCostCopper: 1000,
      totalWeight: 59,
      itemCount: 26,
    });
    expect(findPackageDuplicateWarning('rope-hempen', [pack.id])).toContain(
      "already included in Explorer's Pack",
    );
    const inventory = materializeEquipmentPackage(pack.id);
    expect(inventory).toHaveLength(8);
    expect(
      inventory.every(
        (item) => item.acquisitionSource?.type === 'starting-package',
      ),
    ).toBe(true);
    expect(inventory[0].acquisitionSource).toMatchObject({
      sourceId: "Explorer's Pack",
    });
  });
});
