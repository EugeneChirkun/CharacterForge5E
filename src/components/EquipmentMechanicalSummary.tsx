import type { EquipmentDefinition } from '../domain/equipment';

const titleCase = (value: string) =>
  value.replace(/(^|[-\s])\S/g, (character) => character.toUpperCase());

export function EquipmentMechanicalSummary({
  definition,
}: {
  readonly definition: EquipmentDefinition;
}) {
  const mechanics: string[] = [];

  switch (definition.category) {
    case 'weapon':
      mechanics.push(
        `${titleCase(definition.weaponCategory)} ${definition.weaponType} weapon`,
      );
      if (definition.damage) {
        mechanics.push(
          `Damage: ${definition.damage.diceCount}d${definition.damage.dieSize} ${definition.damage.damageType}`,
        );
      }
      if (definition.properties.length) {
        mechanics.push(
          `Properties: ${definition.properties.map(titleCase).join(', ')}`,
        );
      }
      if (definition.range) {
        mechanics.push(
          `Range: ${definition.range.normal}${definition.range.long ? `/${definition.range.long}` : ''} ft`,
        );
      }
      break;
    case 'armor': {
      mechanics.push(`${titleCase(definition.armorCategory)} armor`);
      const dexterityRule =
        definition.dexterityModifier.type === 'full'
          ? ' + Dexterity modifier'
          : definition.dexterityModifier.type === 'capped'
            ? ` + Dexterity modifier (maximum +${definition.dexterityModifier.maximum})`
            : '';
      mechanics.push(`AC: ${definition.baseArmorClass}${dexterityRule}`);
      break;
    }
    case 'shield':
      mechanics.push(`AC bonus: +${definition.armorClassBonus}`);
      break;
  }

  if (!mechanics.length) return null;

  return (
    <ul
      className="equipment-mechanical-summary"
      aria-label={`${definition.name} mechanics`}
    >
      {mechanics.map((mechanic) => (
        <li key={mechanic}>{mechanic}</li>
      ))}
    </ul>
  );
}
