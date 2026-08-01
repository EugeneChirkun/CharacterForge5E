# Deferred Druid equipment follow-ups

These items are **deferred** and are not implemented by the Iteration 3.5B UI patch.

1. Expand production data with additional **verified** Druidic Focus choices only
   after reviewing staff, wand, totem, wooden-object and other verified forms,
   including price, weight, slot behavior, other roles, and source metadata.
2. Model equipment with multiple capabilities rather than duplicating objects:

   ```ts
   export type EquipmentCapability =
     | { readonly type: 'weapon'; readonly weaponDefinitionId: string }
     | { readonly type: 'spellcasting-focus'; readonly focusType: 'druidic' };

   export interface EquipmentDefinition {
     readonly id: string;
     readonly name: string;
     readonly capabilities: readonly EquipmentCapability[];
     // existing fields
   }
   ```

3. Resolve quarterstaff weapon/focus identity and pricing. Distinguish the base
   market item, package-granted variant, focus capability, acquisition price, and
   actual inventory instance to avoid ambiguous duplicate physical objects.
4. Add detailed mechanical summaries from structured definitions, never manually
   duplicated React text. Weapons should eventually show classification, damage,
   properties, range, cost, weight, and proficiency; armor should show category,
   AC/Dexterity rules, Strength, Stealth, cost, weight, and proficiency; shields
   should show AC bonus, cost, weight, and proficiency. Omit unknown values.
5. Define package price versus market price semantics without changing the base
   definition when recording an acquisition price.
6. Add regression tests preventing duplicate physical quarterstaff inventory
   entries when an item has both weapon and focus capabilities.
