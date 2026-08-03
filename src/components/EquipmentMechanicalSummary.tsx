import type { EquipmentDefinition } from '../domain/equipment';

const titleCase = (value: string) =>
  value.replace(/(^|[-\s])\S/g, (character) => character.toUpperCase());

export function EquipmentMechanicalSummary({
  definition,
  proficient,
}: {
  readonly definition: EquipmentDefinition;
  readonly proficient?: boolean;
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
      mechanics.push(
        `Strength requirement: ${definition.strengthRequirement ?? 'None'}`,
      );
      mechanics.push(
        `Stealth: ${definition.stealthDisadvantage ? 'Disadvantage' : 'Normal'}`,
      );
      break;
    }
    case 'shield':
      mechanics.push(`AC bonus: +${definition.armorClassBonus}`);
      break;
  }

  if (mechanics.length && definition.priceCopper !== undefined)
    mechanics.push(
      `Cost: ${definition.priceCopper < 100 ? `${definition.priceCopper / 10} SP` : `${definition.priceCopper / 100} GP`}`,
    );
  if (mechanics.length && definition.weight !== undefined)
    mechanics.push(`Weight: ${definition.weight} lb`);
  if (
    proficient !== undefined &&
    ['weapon', 'armor', 'shield'].includes(definition.category)
  )
    mechanics.push(
      `Proficiency: ${proficient ? 'Proficient' : 'Not proficient'}`,
    );

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
