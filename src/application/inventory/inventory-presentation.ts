import { calculateArmorClass } from '../../domain/armor-class';
import {
  selectEquipment,
  type CharacterInventory,
} from '../../domain/equipment';
import type { CharacterViewModel } from '../../features/characters/character.types';

/** Keeps inventory-derived presentation outside React while persisted records remain authoritative. */
export function applyInventoryToViewModel(
  character: CharacterViewModel,
  inventory: CharacterInventory,
): CharacterViewModel {
  const equipment = selectEquipment(inventory);
  const armorClass = calculateArmorClass({
    sources: [
      {
        type: 'unarmored',
        base: 10,
        abilityModifiers: ['dexterity'],
        label: 'Unarmored',
      },
      ...equipment.armorClassSources,
    ],
    abilityModifiers: Object.fromEntries(
      Object.entries(character.abilities).map(([name, ability]) => [
        name,
        ability.modifier,
      ]),
    ) as Record<keyof CharacterViewModel['abilities'], number>,
  });
  return {
    ...character,
    inventory,
    armorClass: armorClass.value,
    carriedWeight: equipment.carriedWeight,
    ownedWeight: equipment.ownedWeight,
    armorClassExplanation: [
      ...equipment.armorClassSteps,
      ...armorClass.steps.map(
        (step) => `${step.label}: ${step.value >= 0 ? '+' : ''}${step.value}`,
      ),
    ],
    diagnostics: [
      ...character.diagnostics.filter(
        (d) => !equipment.diagnostics.some((e) => e.type === d),
      ),
      ...equipment.diagnostics.map((d) => d.type),
    ],
  };
}
